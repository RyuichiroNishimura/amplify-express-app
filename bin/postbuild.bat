del/S .amplify-hosting

mkdir .amplify-hosting\compute\

xcopy/E dist .amplify-hosting\compute\default\
xcopy/E node_modules .amplify-hosting\compute\default\node_modules\

xcopy/E public .amplify-hosting\static\

copy deploy-manifest.json .amplify-hosting\deploy-manifest.json