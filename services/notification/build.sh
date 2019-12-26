
#!/bin/bash
set -e
set -o pipefail

instruction()
{
  echo "usage: ./build.sh deploy <stage> <region>"
  echo ""
  echo "stage: eg. int, staging, test, prod, ..."
  echo "region: eg. eu-central-1, eu-west-1, ..."
  echo ""
  echo "for example: ./build.sh deploy test eu-central-1"
}

if [ $# -eq 0 ]; then
  instruction
  exit 1
elif [ "$1" = "install" ] && [ $# -eq 1 ]; then
  npm install

# elif [ "$1" = "int-test" ] && [ $# -eq 1 ]; then
#   npm install

#   npm run integration-test
# elif [ "$1" = "acceptance-test" ] && [ $# -eq 1 ]; then
#   npm install

#   npm run acceptance-test
elif [ "$1" = "deploy" ] && [ $# -eq 3 ]; then
  STAGE=$2
  REGION=$3

  npm run sls -- deploy -s $STAGE -r $REGION
else
  instruction
  exit 1
fi