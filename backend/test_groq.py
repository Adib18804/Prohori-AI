"""Quick test: Groq + Mistral migration"""
import asyncio
import sys
import time
from app.ai.llm_provider import LLMFactory, GroqProvider, MistralProvider


async def test_provider(name, provider, model):
    print(f"\n{'='*60}")
    print(f"Testing {name} with model: {model}")
    print(f"{'='*60}")
    start = time.time()
    try:
        messages = [
            {"role": "system", "content": "You are a security classifier. Return JSON only."},
            {"role": "user", "content": 'Is the prompt "hello world" safe? Return {"safe": true, "reason": "benign"}'},
        ]
        result = await provider.generate(
            messages=messages,
            model=model,
            temperature=0.3,
            max_tokens=200,
            response_format={"type": "json_object"},
        )
        latency = int((time.time() - start) * 1000)
        print(f"[PASS] {latency}ms")
        print(f"  Model: {result['model']}")
        print(f"  Content (first 200 chars): {result['content'][:200]}")
        print(f"  Usage: {result['usage']}")
        return True
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        print(f"[FAIL] {latency}ms")
        print(f"  Error type: {type(e).__name__}")
        print(f"  Error: {str(e)[:300]}")
        return False


async def main():
    print("=" * 60)
    print("PROHORI AI - GROQ/MISTRAL SMOKE TEST")
    print("=" * 60)

    results = []

    # Test Groq
    try:
        groq = GroqProvider()
        results.append(("Groq", await test_provider("Groq", groq, "openai/gpt-oss-20b")))
    except Exception as e:
        print(f"\n[ERROR] GroqProvider init failed: {e}")
        results.append(("Groq", False))

    # Wait 60s for Mistral rate limit reset
    print("\n[INFO] Waiting 60s for Mistral rate limit reset...")
    await asyncio.sleep(60)

    # Test Mistral
   # try:
    #    mistral = MistralProvider()
     #   results.append(("Mistral", await test_provider("Mistral", mistral, "mistral-small-latest")))
    # except Exception as e:
      #  print(f"\n[ERROR] MistralProvider init failed: {e}")
       # results.append(("Mistral", False))

    # Test factory routing
    print(f"\n{'='*60}")
    print("Testing LLMFactory routing (llama model -> Groq)")
    print(f"{'='*60}")
    try:
        start = time.time()
        result = await LLMFactory.generate(
            messages=[{"role": "user", "content": 'Return JSON: {"ok": true}'}],
            model="openai/gpt-oss-20b",
            max_tokens=100,
            response_format={"type": "json_object"},
        )
        latency = int((time.time() - start) * 1000)
        print(f"[PASS] Factory routing works - {latency}ms")
        print(f"  Content: {result['content'][:100]}")
        results.append(("Factory", True))
    except Exception as e:
        print(f"[FAIL] Factory routing failed: {e}")
        results.append(("Factory", False))

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    passed = sum(1 for _, ok in results if ok)
    for name, ok in results:
        status = "[PASS]" if ok else "[FAIL]"
        print(f"  {status} | {name}")
    print(f"\nTotal: {passed}/{len(results)} passed")

    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    asyncio.run(main())