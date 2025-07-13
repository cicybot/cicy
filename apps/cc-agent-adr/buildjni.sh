#!/bin/bash
set -ex

git clone --recursive https://github.com/eycorsican/leaf
cd leaf
git checkout v0.11.0

git apply --check ../leaf.patch
git apply ../leaf.patch

export NDK_HOME=/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018

cargo install cbindgen

sh ./scripts/build_android.sh

mkdir -p ../app/src/main/jniLibs/arm64-v8a
mkdir -p ../app/src/main/jniLibs/armeabi-v7a
mkdir -p ../app/src/main/jniLibs/x86
mkdir -p ../app/src/main/jniLibs/x86_64
mkdir -p ./target/leaf-android-libs

cp ./target/leaf-android-libs/libleaf-aarch64-linux-android.so ../app/src/main/jniLibs/arm64-v8a/libleaf.so
cp ./target/leaf-android-libs/libleaf-armv7-linux-androideabi.so ../app/src/main/jniLibs/armeabi-v7a/libleaf.so
cp ./target/leaf-android-libs/libleaf-i686-linux-android.so ../app/src/main/jniLibs/x86/libleaf.so
cp ./target/leaf-android-libs/libleaf-x86_64-linux-android.so ../app/src/main/jniLibs/x86_64/libleaf.so

cd ..

rm -rf leaf
