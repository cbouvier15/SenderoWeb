#!/bin/bash

echo "###################################"
echo "Sendero Web/Mobile Interface Deploy"
echo "###################################"
echo

STREAMING_PATH="$HOME/Desktop/var/www/streaming_server/"
SENDERO_PATH="$HOME/Desktop/var/www/sendero/"
WEB_PATH="$HOME/Desktop/var/www/web/"
VR_PATH="$HOME/Desktop/var/www/vr/"

# echo "1. Deploying Streaming Server to $STREAMING_PATH ..."
# cp -r app.js package.json node_modules/ $STREAMING_PATH
# echo "1. Streaming Server deployed"
# echo

echo "2. Deploying Sendero to $SENDERO_PATH ..."
cp -r views/index.html public/styles/ public/images/ $SENDERO_PATH
echo "2. Sendero deployed"
echo

echo "3. Web..."
cp -r public/conf/ public/meshes/ $WEB_PATH
cp views/web.html $WEB_PATH
mv $WEB_PATH"web.html" $WEB_PATH"index.html" 
cp -r public/js/OBJLoader.js public/js/interaction.js public/js/streaming.js public/js/three.min.web.js public/js/xml.parser.js public/js/OrbitControls.web.js public/js/socket.io.min.js public/js/three.helper.js public/js/underscore-min.js $WEB_PATH"js"
echo "3. Web deployed"
echo

# echo "4. Cardboard..."
# cp -r public/conf/ public/meshes/ $VR_PATH
# cp views/cardboard.html $VR_PATH
# mv $VR_PATH"cardboard.html" $VR_PATH"index.html"
# cp -r public/js/DeviceOrientationControls.cardboard.js public/js/StereoEffect.cardboard.js public/js/underscore-min.js public/js/OBJLoader.js public/js/socket.io.min.js public/js/OrbitControls.cardboard.js public/js/three.min.cardboard.js $VR_PATH"js"
# echo "Cardboard deployed!"
echo
