#!/bin/bash

# Updates http://secretspacelab.com/tcm.html

cd /home/ubuntu/kjtcmws

for i in {1..5}; do
  echo "Attempt $i on `date`:"
  PATH="/usr/local/bin:$PATH" ./tcmws.js --html -o /tmp/tcm.html
  if [ $? -eq 0 ]; then
    /bin/mv /tmp/tcm.html /var/www/tcm.html
    echo "Success"
    break
  fi
done

