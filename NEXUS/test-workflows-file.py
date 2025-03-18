#!/usr/bin/env python3
"""
Workflow testing framework for n8n AI Workflow Automation Hub.

This script provides automated testing of n8n workflows, ensuring 
they function correctly before deployment. It supports testing of
AI components, custom nodes, and complex workflow patterns.

Usage:
    python test_workflows.py --workflow=workflow_id
    python test_workflows.py --all
    python test_workflows.py --tag=ai-integration
"""

import json
import os
import sys
import time
import argparse
import logging
import requests
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
import unittest
import pytest
from dotenv import load_dotenv
from unittest.mock import patch, MagicMock

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('workflow_tests.log')
    ]
)
logger = logging.getLogger('nexus-n8n-tests')

# Load environment variables
load_dotenv()

# n8n API Configuration
N8N_HOST = os.getenv('N8N_HOST', 'localhost')
N8N_PORT = os.getenv('N8N_PORT', '5678')
N8N_PROTOCOL = os.getenv('N8N_PROTOCOL', 'http')
N8N_API_KEY = os.getenv('N8N_API_KEY', '')
BASE_URL = f"{N8N_PROTOCOL}://{N8N_HOST}:{N8N_PORT}/api/v1"

# Test environment
TEST_ENV = os.getenv('TEST_ENV', 'isolated')  # Options: 'isolated', 'integrated', 'production'


@dataclass
class TestResult:
    """Data class for storing test results."""
    workflow_id: str
    workflow_name: str
    success: bool
    execution_time: float
    execution_id: Optional[str] = None
    error_message: Optional[str] = None
    output_data: Optional[Dict] = None
    nodes_tested: Optional[List[str]] = None


class WorkflowTestException(Exception):
    """Exception raised for workflow test failures."""
    pass


class MockService:
    """Mock external service integrations for testing."""
    
    @staticmethod
    def mock_openai_response(*args, **kwargs):
        """Mock OpenAI API responses."""
        model = kwargs.get('model', 'gpt-3.5-turbo')
        messages = kwargs.get('messages', [])
        
        if any("generate content" in str(m).lower() for m in messages):
            return {
                "choices": [
                    {
                        "message": {
                            "content": "This is a mock response for content generation."
                        }
                    }
                ]
            }
        elif any("classify" in str(m).lower() for m in messages):
            return {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps({
                                "category": "Test Category",
                                "confidence": 0.95,
                                "reasoning": "This is a test classification."
                            })
                        }
                    }
                ]
            }
        else:
            return {
                "choices": [
                    {
                        "message": {
                            "content": "This is a generic mock response."
                        }
                    }
                ]
            }
    
    @staticmethod
    def mock_langchain_response(*args, **kwargs):
        """Mock LangChain responses."""
        return {
            "result": {
                "output": "This is a mock LangChain response.",
                "metadata": {
                    "model": "mock-model",
                    "tokens": 15,
                    "process_time": 0.1
                }
            }
        }
    
    @staticmethod
    def mock_webhook_response(*args, **kwargs):
        """Mock webhook responses."""
        return {
            "status": "success",
            "webhook_id": "mock-webhook-id",
            "data": {
                "timestamp": time.time(),
                "event": "mock_event",
                "payload": {"key": "value"}
            }
        }


class N8nAPI:
    """Interface for interacting with n8n API."""
    
    def __init__(self, base_url: str = BASE_URL, api_key: str = N8N_API_KEY):
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if api_key:
            self.headers["X-N8N-API-KEY"] = api_key
    
    def get_workflow(self, workflow_id: str) -> Dict:
        """Retrieve a workflow by ID."""
        response = requests.get(
            f"{self.base_url}/workflows/{workflow_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def list_workflows(self, tag: Optional[str] = None) -> List[Dict]:
        """List all workflows, optionally filtered by tag."""
        params = {}
        if tag:
            params["filter"] = f"tag:{tag}"
            
        response = requests.get(
            f"{self.base_url}/workflows",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def execute_workflow(self, workflow_id: str, data: Dict = None) -> Dict:
        """Execute a workflow with optional input data."""
        payload = {} if data is None else {"data": data}
        
        response = requests.post(
            f"{self.base_url}/workflows/{workflow_id}/execute",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def get_execution(self, execution_id: str) -> Dict:
        """Get details of a workflow execution."""
        response = requests.get(
            f"{self.base_url}/executions/{execution_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def wait_for_execution(
        self, 
        execution_id: str, 
        timeout: int = 60, 
        poll_interval: int = 2
    ) -> Dict:
        """Wait for a workflow execution to complete."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            execution = self.get_execution(execution_id)
            if execution["status"] in ["success", "error", "failed"]:
                return execution
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Execution {execution_id} did not complete within {timeout} seconds")


class WorkflowTester:
    """Core workflow testing functionality."""
    
    def __init__(self, api: N8nAPI = None, test_env: str = TEST_ENV):
        self.api = api or N8nAPI()
        self.test_env = test_env
        self.mock_services = MockService()
    
    def _prepare_test_data(self, workflow_id: str) -> Dict:
        """Prepare test data for a specific workflow."""
        # Load test data from JSON file if it exists
        test_data_path = f"test_data/{workflow_id}.json"
        if os.path.exists(test_data_path):
            with open(test_data_path, 'r') as f:
                return json.load(f)
        
        # Default test data for common workflow types
        workflow = self.api.get_workflow(workflow_id)
        workflow_name = workflow.get("name", "").lower()
        
        if "twitter" in workflow_name or "social" in workflow_name:
            return {
                "content": "This is a test post from automated workflow testing.",
                "scheduledTime": "2099-12-31T23:59:59Z"  # Far future to prevent actual posting
            }
        elif "email" in workflow_name:
            return {
                "to": "test@example.com",
                "subject": "Test Email from Workflow Testing",
                "text": "This is a test email generated during automated workflow testing."
            }
        elif "document" in workflow_name or "pdf" in workflow_name:
            return {
                "document": "https://example.com/sample.pdf",
                "language": "en",
                "options": {"extractText": True}
            }
        elif "scrape" in workflow_name or "web" in workflow_name:
            return {
                "url": "https://example.com",
                "selectors": {"title": "h1", "content": ".main-content"}
            }
        
        # Default data if no matches
        return {
            "testInput": True,
            "timestamp": time.time(),
            "testEnvironment": self.test_env
        }
    
    def test_workflow(self, workflow_id: str) -> TestResult:
        """Test a specific workflow and return the results."""
        start_time = time.time()
        
        try:
            # Get workflow details
            workflow = self.api.get_workflow(workflow_id)
            workflow_name = workflow.get("name", f"Workflow {workflow_id}")
            
            # Prepare test data
            test_data = self._prepare_test_data(workflow_id)
            
            # Execute workflow with appropriate mock setup based on environment
            if self.test_env == 'isolated':
                with patch('requests.post') as mock_post, \
                     patch('requests.get') as mock_get:
                    
                    # Configure mocks based on workflow nodes
                    nodes = workflow.get("nodes", [])
                    for node in nodes:
                        node_type = node.get("type", "")
                        
                        if "openai" in node_type:
                            mock_post.return_value.json.return_value = self.mock_services.mock_openai_response()
                            mock_post.return_value.status_code = 200
                        elif "langchain" in node_type:
                            mock_post.return_value.json.return_value = self.mock_services.mock_langchain_response()
                            mock_post.return_value.status_code = 200
                        elif "webhook" in node_type:
                            mock_post.return_value.json.return_value = self.mock_services.mock_webhook_response()
                            mock_post.return_value.status_code = 200
                    
                    # Execute workflow with mocks active
                    result = self.api.execute_workflow(workflow_id, test_data)
            else:
                # Execute workflow with real external services
                result = self.api.execute_workflow(workflow_id, test_data)
            
            # Get execution ID and wait for completion
            execution_id = result.get("executionId")
            if not execution_id:
                raise WorkflowTestException("No execution ID returned")
            
            execution = self.api.wait_for_execution(execution_id)
            
            # Analyze execution results
            status = execution.get("status")
            if status != "success":
                error_node = None
                error_message = "Unknown error"
                
                # Try to find the error node and message
                for node_execution in execution.get("nodeExecutions", {}).values():
                    for execution_data in node_execution:
                        if execution_data.get("error"):
                            error_node = execution_data.get("node", {}).get("name")
                            error_message = execution_data.get("error", {}).get("message", "Unknown error")
                            break
                
                return TestResult(
                    workflow_id=workflow_id,
                    workflow_name=workflow_name,
                    success=False,
                    execution_time=time.time() - start_time,
                    execution_id=execution_id,
                    error_message=f"Error in node '{error_node}': {error_message}"
                )
            
            # Extract output data
            output_data = {}
            nodes_tested = []
            
            for node_name, node_execution in execution.get("nodeExecutions", {}).items():
                nodes_tested.append(node_name)
                for execution_data in node_execution:
                    if execution_data.get("data", {}).get("main"):
                        output_data[node_name] = execution_data.get("data", {}).get("main", [])
            
            return TestResult(
                workflow_id=workflow_id,
                workflow_name=workflow_name,
                success=True,
                execution_time=time.time() - start_time,
                execution_id=execution_id,
                output_data=output_data,
                nodes_tested=nodes_tested
            )
            
        except Exception as e:
            logger.error(f"Error testing workflow {workflow_id}: {str(e)}")
            return TestResult(
                workflow_id=workflow_id,
                workflow_name=workflow_id,  # Fallback if we couldn't get the name
                success=False,
                execution_time=time.time() - start_time,
                error_message=str(e)
            )
    
    def test_workflows_by_tag(self, tag: str) -> List[TestResult]:
        """Test all workflows with a specific tag."""
        workflows = self.api.list_workflows(tag)
        results = []
        
        for workflow in workflows:
            workflow_id = workflow.get("id")
            if workflow_id:
                results.append(self.test_workflow(workflow_id))
        
        return results
    
    def test_all_workflows(self) -> List[TestResult]:
        """Test all workflows in the n8n instance."""
        workflows = self.api.list_workflows()
        results = []
        
        for workflow in workflows:
            workflow_id = workflow.get("id")
            if workflow_id:
                results.append(self.test_workflow(workflow_id))
        
        return results


def generate_report(results: List[TestResult], output_format: str = "text") -> None:
    """Generate a test report in the specified format."""
    total = len(results)
    passed = sum(1 for r in results if r.success)
    failed = total - passed
    success_rate = (passed / total) * 100 if total > 0 else 0
    
    if output_format == "text":
        print("\n" + "=" * 80)
        print(f"WORKFLOW TEST RESULTS: {passed}/{total} passed ({success_rate:.1f}%)")
        print("=" * 80)
        
        for result in results:
            status = "✅ PASSED" if result.success else "❌ FAILED"
            print(f"\n{status}: {result.workflow_name} (ID: {result.workflow_id})")
            print(f"  Execution Time: {result.execution_time:.2f}s")
            
            if result.execution_id:
                print(f"  Execution ID: {result.execution_id}")
            
            if not result.success and result.error_message:
                print(f"  Error: {result.error_message}")
            
            if result.nodes_tested:
                print(f"  Nodes Tested: {', '.join(result.nodes_tested)}")
        
        print("\n" + "=" * 80)
        print(f"SUMMARY: {passed} passed, {failed} failed, {success_rate:.1f}% success rate")
        print("=" * 80)
    
    elif output_format == "json":
        report = {
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "success_rate": success_rate
            },
            "results": [vars(r) for r in results]
        }
        print(json.dumps(report, indent=2))
    
    elif output_format == "github":
        # GitHub Actions format
        print("::group::Workflow Test Results")
        print(f"Total: {total}, Passed: {passed}, Failed: {failed}, Success Rate: {success_rate:.1f}%")
        print("::endgroup::")
        
        for result in results:
            if not result.success:
                node_info = ""
                if result.nodes_tested:
                    node_info = f" (Nodes tested: {', '.join(result.nodes_tested)})"
                    
                print(f"::error file={result.workflow_id}::{result.error_message}{node_info}")


def main():
    """Main entry point for the workflow testing script."""
    parser = argparse.ArgumentParser(description="Test n8n workflows")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--workflow", help="Test a specific workflow by ID")
    group.add_argument("--tag", help="Test all workflows with a specific tag")
    group.add_argument("--all", action="store_true", help="Test all workflows")
    
    parser.add_argument("--format", choices=["text", "json", "github"], default="text",
                        help="Output format for test results")
    parser.add_argument("--env", choices=["isolated", "integrated", "production"], 
                        default=TEST_ENV, help="Test environment")
    
    args = parser.parse_args()
    
    # Initialize tester
    tester = WorkflowTester(test_env=args.env)
    
    # Run tests based on arguments
    if args.workflow:
        results = [tester.test_workflow(args.workflow)]
    elif args.tag:
        results = tester.test_workflows_by_tag(args.tag)
    else:  # args.all
        results = tester.test_all_workflows()
    
    # Generate report
    generate_report(results, args.format)
    
    # Exit with error code if any tests failed
    if any(not r.success for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
