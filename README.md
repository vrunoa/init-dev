# init-dev
Automate the packages you want to install when you create a new Node project

# Install
```bash
npm i -g init-dev
```

# Usage
Create a *.json* file with a list of the modules you would like to have in any new project.

For eaxmple
```bash
[
  "standard",
  "husky"
]
```
You can either use a local file or a remote file, like the one I create on gist for myself
[https://gist.githubusercontent.com/vrunoa/afc7a6998e8a0ab4d3d8f91c51da73e6/raw/ad1b82c2bd4a5c9ca0d9f7a5fd823d9fa738fbf3/.dev.package.json](https://gist.githubusercontent.com/vrunoa/afc7a6998e8a0ab4d3d8f91c51da73e6/raw/ad1b82c2bd4a5c9ca0d9f7a5fd823d9fa738fbf3/.dev.package.json)

As a first step, run the configuration `initDev --config` that will ask you the path to this *.json* file and read the modules you want and create a `.dev.package.json` on your home folder.

Once you create a new project you can now run:
```bash
initDev --install
```
an all the packages you need to start developing will be installed.

#Extras
Run `initDev --info` to check which modules are you installing
