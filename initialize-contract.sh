#!/bin/bash

# Initialize Throne Contract
# This script initializes the throne-noir contract with the backend public key

CONTRACT_ID="CD6RYSLZXSPLF7U5HOV5B7N62ICZEKXRZUAM6KWIEOF2NP2GTTT3BGOO"
ADMIN="GAUXYHLV65LYUIRK7QDQKAVSDGG7F4PV2HZFW2OVIUXINIWQGG2BGK5V"
BACKEND_PUBKEY="297c1d75f7578a222afc070502b2198df2f1f5d1f25b69d5452e86a2d031b413"
BACKEND_SECRET="SDYQGKMJHLKHOWDJ75PEAVTEYUIR2VFJNTXJW3OJQ5FXTOCGXTTTE33A"

echo "🔧 Initializing Throne Contract..."
echo "📝 Contract ID: $CONTRACT_ID"
echo "👤 Admin: $ADMIN"  
echo "🔑 Backend Pubkey: $BACKEND_PUBKEY"
echo ""

# Initialize the contract
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account $BACKEND_SECRET \
  --network testnet \
  -- initialize \
  --admin $ADMIN \
  --backend_pubkey $BACKEND_PUBKEY \
  --required_trials 7

echo ""
echo "✅ Contract initialized!"
