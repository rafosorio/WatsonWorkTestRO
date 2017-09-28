cf api https://api.eu-gb.bluemix.net
cf login -u steve.lievens@be.ibm.com -o steve.lievens_org -s dev
cf push -f manifest-dev.yml
