npx hardhat node &
sleep 10
npx hardhat run --network localhost scripts/deploy.ts
# while sleep 1; do npx hardhat --network localhost automateDispatch; done
while true; do  sleep 1; done