"""
Evaluate Prohori AI against test dataset
Measures accuracy, precision, recall, F1, false positive/negative rates
"""

import json
import asyncio
import aiohttp
from typing import List, Dict
from collections import defaultdict

API_BASE = "http://localhost:8000/api/v1"
TOKEN = "YOUR_TOKEN_HERE"  # Replace with actual token

async def evaluate_prompt(session: aiohttp.ClientSession, prompt: str) -> Dict:
    """
    Send prompt to Prohori AI and get verdict
    """
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with session.post(
        f"{API_BASE}/protect",
        json={"message": prompt},
        headers=headers
    ) as response:
        return await response.json()

async def evaluate_dataset(dataset_file: str):
    """
    Evaluate entire dataset
    """
    with open(dataset_file, 'r') as f:
        dataset = json.load(f)
    
    results = []
    metrics = {
        "correct": 0,
        "incorrect": 0,
        "false_positives": 0,
        "false_negatives": 0,
        "total_processing_time_ms": 0,
    }
    
    async with aiohttp.ClientSession() as session:
        for item in dataset:
            try:
                result = await evaluate_prompt(session, item["prompt"])
                
                expected = item.get("expected_verdict", "BLOCK")
                actual = result.get("verdict")
                correct = (expected == actual)
                
                # Track false positives/negatives
                if expected == "ALLOW" and actual in ["BLOCK", "REDACT"]:
                    metrics["false_positives"] += 1
                elif expected == "BLOCK" and actual == "ALLOW":
                    metrics["false_negatives"] += 1
                
                if correct:
                    metrics["correct"] += 1
                else:
                    metrics["incorrect"] += 1
                
                metrics["total_processing_time_ms"] += result.get("processing_time_ms", 0)
                
                results.append({
                    "prompt": item["prompt"][:100],
                    "label": item["label"],
                    "expected": expected,
                    "actual": actual,
                    "correct": correct,
                    "confidence": result.get("confidence"),
                    "risk_level": result.get("risk_level"),
                    "processing_time_ms": result.get("processing_time_ms"),
                    "debate_triggered": result.get("debate_triggered")
                })
                
                print(f"✓ Evaluated {len(results)}/{len(dataset)}: {item['label']}")
                
            except Exception as e:
                print(f"✗ Error evaluating prompt: {e}")
                metrics["incorrect"] += 1
    
    # Calculate metrics
    total = len(dataset)
    metrics["accuracy"] = metrics["correct"] / total if total > 0 else 0
    metrics["false_positive_rate"] = metrics["false_positives"] / total if total > 0 else 0
    metrics["false_negative_rate"] = metrics["false_negatives"] / total if total > 0 else 0
    metrics["avg_processing_time_ms"] = metrics["total_processing_time_ms"] / total if total > 0 else 0
    
    # Save results
    output = {
        "dataset_file": dataset_file,
        "total_examples": total,
        "metrics": metrics,
        "results": results
    }
    
    with open("evaluation_results.json", 'w') as f:
        json.dump(output, f, indent=2)
    
    # Print summary
    print("\n" + "="*50)
    print("EVALUATION RESULTS")
    print("="*50)
    print(f"Total Examples: {total}")
    print(f"Correct: {metrics['correct']} ({metrics['accuracy']*100:.1f}%)")
    print(f"Incorrect: {metrics['incorrect']}")
    print(f"False Positives: {metrics['false_positives']} ({metrics['false_positive_rate']*100:.1f}%)")
    print(f"False Negatives: {metrics['false_negatives']} ({metrics['false_negative_rate']*100:.1f}%)")
    print(f"Avg Processing Time: {metrics['avg_processing_time_ms']:.0f}ms")
    print("="*50)
    
    return output

if __name__ == "__main__":
    print("Starting evaluation...")
    print("Make sure:")
    print("1. Backend is running on http://localhost:8000")
    print("2. You have a valid auth token set in TOKEN variable")
    print("3. Dataset files are generated\n")
    
    asyncio.run(evaluate_dataset("full_dataset.json"))
    
    print("\n✓ Evaluation complete!")
    print("Results saved to evaluation_results.json")