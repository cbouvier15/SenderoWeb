#!/bin/bash

echo "###################################"
echo "Sendero Web/Mobile Interface Deploy"
echo "###################################"
echo

STREAMING_PATH="/var/www/streaming_server/"
SENDERO_PATH="/var/www/sendero/"
WEB_PATH="/var/www/web/"
VR_PATH="/var/www/vr/"

if [ $# -gt 0 ]; then

	DEPLOY_SS=false
	DEPLOY_SENDERO=false
	DEPLOY_WEB=false
	DEPLOY_VR=false

	for var in "$@"
	do
    	if [ "$var" = "streaming_server" ]; then
    		DEPLOY_SS=true
    	fi
    	if [ "$var" = "sendero" ]; then
    		DEPLOY_SENDERO=true
    	fi
    	if [ "$var" = "web" ]; then
    		DEPLOY_WEB=true
    	fi
    	if [ "$var" = "vr" ]; then
    		DEPLOY_VR=true
    	fi
    	if [ "$var" = "all" ]; then
    		DEPLOY_SS=true
    		DEPLOY_SENDERO=true
    		DEPLOY_WEB=true
    		DEPLOY_VR=true
    	fi
	done

	if $DEPLOY_SS ; then
		echo "--> Deploying Streaming Server to $STREAMING_PATH ..."
		cp -r app.js package.json node_modules $STREAMING_PATH
		echo "Streaming Server deployed!"
		echo
	fi

	if $DEPLOY_SENDERO ; then
		echo "--> Deploying Sendero to $SENDERO_PATH ..."
		cp -r views/index.html public/styles public/images $SENDERO_PATH
		echo "Sendero deployed!"
		echo
	fi

	if $DEPLOY_WEB ; then
		echo "--> Deploying Web to $WEB_PATH ..."
		cp -r public/conf public/meshes $WEB_PATH
		cp views/web.html $WEB_PATH
		mv $WEB_PATH"web.html" $WEB_PATH"index.html" 
		cp -r public/js/OBJLoader.js public/js/interaction.js public/js/streaming.js public/js/three.min.web.js public/js/xml.parser.js public/js/OrbitControls.web.js public/js/socket.io.min.js public/js/three.helper.js public/js/underscore-min.js $WEB_PATH"js"
		echo "Web deployed!"
		echo
	fi

	if $DEPLOY_VR ; then
		echo "--> Deploying Cardboard to $VR_PATH ..."
		cp -r public/conf public/meshes $VR_PATH
		cp views/cardboard.html $VR_PATH
		mv $VR_PATH"cardboard.html" $VR_PATH"index.html"
		cp -r public/js/DeviceOrientationControls.cardboard.js public/js/StereoEffect.cardboard.js public/js/underscore-min.js public/js/OBJLoader.js public/js/socket.io.min.js public/js/OrbitControls.cardboard.js public/js/three.min.cardboard.js $VR_PATH"js"
		echo "Cardboard deployed!"
		echo
	fi
	
else 
	printf "Indicate which app do you want to deploy:\n\t-streaming_server\n\t-sendero\n\t-web\n\t-vr\n\t-all\n"
fi
