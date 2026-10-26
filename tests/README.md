# Prohori AI Security Testing

Comprehensive security test suite for the Prohori AI multi-agent security gateway.

## Test Structure

```
tests/
├── conftest.py              # Pytest configuration and fixtures
├── test_agents.py           # Unit tests for individual agents
├── test_attack_taxonomy.py  # Tests for attack classification
├── test_integration.py      # End-to-end integration tests
├── test_security.py         # Original security tests
├── run_tests.py             # Test runner script
└── README.md                # This file
```

## Running Tests

### Install Dependencies

```bash
cd backend
pip install pytest pytest-asyncio pytest-cov
```

### Run All Tests

```bash
cd tests
python run_tests.py
```

Or directly with pytest:

```bash
pytest -v
```

### Run Specific Test Categories

**Unit Tests Only:**
```bash
python run_tests.py --unit
```

**Integration Tests Only:**
```bash
python run_tests.py --integration
```

**With Coverage Report:**
```bash
python run_tests.py --coverage
```

### Run Specific Test Files

```bash
pytest test_agents.py -v
pytest test_integration.py -v
pytest test_attack_taxonomy.py -v
```

### Run Specific Test Classes

```bash
pytest test_agents.py::TestTriageAgent -v
pytest test_integration.py::TestSecurityPipeline -v
```

### Run Specific Test Methods

```bash
pytest test_agents.py::TestTriageAgent::test_benign_classification -v
```

## Test Categories

### 1. Agent Unit Tests (`test_agents.py`)

Tests individual agent behavior in isolation:

- **TriageAgent**
  - Benign classification
  - Injection detection
  - Jailbreak detection
  - Extraction detection
  - Confidence scoring

- **ProsecutorAgent**
  - Building blocking cases
  - Incorporating RAG evidence
  - Risk assessment

- **DefenderAgent**
  - Benign interpretations
  - Challenging weak prosecution
  - False positive reduction

- **JudgeAgent**
  - Final verdict rendering
  - Balancing prosecutor/defender arguments
  - Confidence calibration

- **Anti-Prompt-Injection**
  - Ensuring agents resist manipulation
  - Role consistency

### 2. Attack Taxonomy Tests (`test_attack_taxonomy.py`)

Tests attack classification and detection:

- Enum definitions (AttackType, VerdictType, etc.)
- Heuristic pattern matching
- Injection patterns
- Jailbreak patterns
- Extraction patterns
- PII redaction

### 3. Integration Tests (`test_integration.py`)

Tests end-to-end security pipeline:

- **Security Pipeline**
  - Benign fast lane
  - Malicious debate triggering
  - Complete metadata

- **Attack Detection**
  - Multiple attack types
  - Parametrized test cases

- **Error Handling**
  - Empty prompts
  - Very long prompts
  - Fail-closed behavior

- **Feature Integration**
  - RAG memory integration
  - ML classifier integration

- **Performance**
  - Fast lane performance
  - Debate performance

### 4. Original Security Tests (`test_security.py`)

Legacy comprehensive security tests:

- Basic agent functionality
- Orchestrator pipeline
- Anti-prompt-injection validation

## Test Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Agents | 80%+ |
| Orchestrator | 90%+ |
| Security Utils | 85%+ |
| API Endpoints | 70%+ |
| Overall | 75%+ |

## Writing New Tests

### Example: Testing a New Agent

```python
import pytest
from app.agents import MyNewAgent

class TestMyNewAgent:
    """Test MyNewAgent behavior"""
    
    @pytest.mark.asyncio
    async def test_basic_functionality(self):
        """Test agent performs basic task"""
        agent = MyNewAgent()
        result = await agent.analyze("test input")
        
        assert result is not None
        assert "expected_field" in result
        assert result["expected_field"] == "expected_value"
```

### Example: Testing Attack Detection

```python
@pytest.mark.asyncio
async def test_detects_new_attack_type(self):
    """Test detection of new attack pattern"""
    orchestrator = SecurityOrchestrator()
    
    result = await orchestrator.analyze_prompt(
        "New attack pattern here",
        user_id="test_user"
    )
    
    assert result["verdict"] in ["BLOCK", "REDACT"]
    assert "new_attack_type" in result.get("attack_types", [])
```

## Test Data

Test prompts are categorized as:

### Benign Prompts
- Educational questions
- Code writing requests
- General knowledge queries

### Malicious Prompts
- Prompt injection attempts
- Jailbreak attempts
- System prompt extraction
- Role manipulation
- Data exfiltration

### Ambiguous Prompts
- Security research questions
- Meta-questions about AI
- Borderline cases

## Environment Setup

Tests use a separate test database and configuration:

```python
# conftest.py
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture
def test_settings():
    settings = get_settings()
    settings.environment = "test"
    settings.enable_rag_memory = False  # Disable for unit tests
    return settings
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov
      
      - name: Run tests
        run: |
          cd tests
          python run_tests.py --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Fixtures

Available fixtures in `conftest.py`:

- `event_loop`: Async event loop for tests
- `test_db`: Test database session
- `db_session`: Database session per test
- `test_settings`: Test configuration

## Mocking External Services

For tests that don't need real LLM calls:

```python
from unittest.mock import Mock, patch

@patch('app.ai.llm_provider.LLMProvider.generate')
async def test_with_mocked_llm(mock_generate):
    """Test with mocked LLM responses"""
    mock_generate.return_value = {
        "classification": "SAFE",
        "confidence": 0.95
    }
    
    # Test code here
    agent = TriageAgent()
    result = await agent.analyze("test")
    
    assert mock_generate.called
```

## Performance Testing

Tests include basic performance assertions:

- Fast lane: < 30 seconds
- Full debate: < 60 seconds

For detailed performance profiling:

```bash
pytest --durations=10
```

## Debugging Failed Tests

### Show Full Output

```bash
pytest -vv -s test_agents.py::TestTriageAgent::test_benign_classification
```

### Show Full Tracebacks

```bash
pytest --tb=long
```

### Drop to Debugger on Failure

```bash
pytest --pdb
```

### Run Last Failed Tests

```bash
pytest --lf
```

## Common Issues

### Issue: Tests timing out

**Solution**: Check if LLM API keys are configured. Some tests require actual API calls.

```bash
# .env
OPENAI_API_KEY=your_key_here
```

### Issue: Import errors

**Solution**: Ensure you're running from the correct directory:

```bash
cd backend
export PYTHONPATH=$PYTHONPATH:$(pwd)
pytest tests/
```

### Issue: Async test warnings

**Solution**: Ensure pytest-asyncio is installed:

```bash
pip install pytest-asyncio
```

## Test Metrics

Track these metrics over time:

- **Pass Rate**: Should be 100%
- **Coverage**: Should be > 75%
- **Execution Time**: Should be < 5 minutes
- **Flakiness**: Should be 0% (no intermittent failures)

## Future Test Improvements

- [ ] Add load testing for concurrent requests
- [ ] Add fuzz testing for malformed inputs
- [ ] Add adversarial testing with attack libraries
- [ ] Add regression tests for fixed vulnerabilities
- [ ] Add property-based testing with Hypothesis
- [ ] Add mutation testing with mutmut

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)
- [Testing Best Practices](https://docs.python-guide.org/writing/tests/)

## Contact

For test-related questions or issues, see the main project README.
