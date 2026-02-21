#!/bin/bash
# Test ZK proof generation

echo "Testing ZK proof generation..."

curl -X POST http://localhost:3030/submit-solution \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "test_secret_42",
    "player": "GAYY2F3OZCLIREXCCKHVR22XUUOJTKG2BXQPMPV5PS67VYKVQD5B736E",
    "roundId": 1
  }'

echo ""
echo "Test complete!"
