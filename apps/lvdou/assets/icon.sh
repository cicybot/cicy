## !!! install imagemagick first
# brew install imagemagick

CUR_DIR=
get_cur_dir() {
    # Get the fully qualified path to the script
    case $0 in
        /*)
            SCRIPT="$0"
            ;;
        *)
            PWD_DIR=$(pwd);
            SCRIPT="${PWD_DIR}/$0"
            ;;
    esac
    # Resolve the true real path without any sym links.
    CHANGED=true
    while [ "X$CHANGED" != "X" ]
    do
        # Change spaces to ":" so the tokens can be parsed.
        SAFESCRIPT=`echo $SCRIPT | sed -e 's; ;:;g'`
        # Get the real path to this script, resolving any symbolic links
        TOKENS=`echo $SAFESCRIPT | sed -e 's;/; ;g'`
        REALPATH=
        for C in $TOKENS; do
            # Change any ":" in the token back to a space.
            C=`echo $C | sed -e 's;:; ;g'`
            REALPATH="$REALPATH/$C"
            # If REALPATH is a sym link, resolve it.  Loop for nested links.
            while [ -h "$REALPATH" ] ; do
                LS="`ls -ld "$REALPATH"`"
                LINK="`expr "$LS" : '.*-> \(.*\)$'`"
                if expr "$LINK" : '/.*' > /dev/null; then
                    # LINK is absolute.
                    REALPATH="$LINK"
                else
                    # LINK is relative.
                    REALPATH="`dirname "$REALPATH"`""/$LINK"
                fi
            done
        done

        if [ "$REALPATH" = "$SCRIPT" ]
        then
            CHANGED=""
        else
            SCRIPT="$REALPATH"
        fi
    done
    # Change the current directory to the location of the script
    CUR_DIR=$(dirname "${REALPATH}")
}

get_cur_dir
PROJECT_DIR=$(dirname "${CUR_DIR}")


echo PROJECT_DIR: $PROJECT_DIR

SRC_PNG=$CUR_DIR/video-course-svgrepo-com.png

WEB_DIR=$CUR_DIR/../public

sips -z 32 32   $SRC_PNG --out $WEB_DIR/favicon.png
sips -z 16 16   $SRC_PNG --out $WEB_DIR/logo-16x16.png
sips -z 64 64   $SRC_PNG --out $WEB_DIR/logo-64x64.png
sips -z 128 128   $SRC_PNG --out $WEB_DIR/logo-128x128.png

ANDROID_DIR=/Users/ton/Desktop/projects/cicy-agent-adr/app/src/main/res

sips -z 96 96   $SRC_PNG --out $ANDROID_DIR/mipmap-xxxhdpi/ic_stat_logo.png
sips -z 72 72   $SRC_PNG --out $ANDROID_DIR/mipmap-xxhdpi/ic_stat_logo.png
sips -z 48 48   $SRC_PNG --out $ANDROID_DIR/mipmap-xhdpi/ic_stat_logo.png
sips -z 36 36   $SRC_PNG --out $ANDROID_DIR/mipmap-hdpi/ic_stat_logo.png
sips -z 24 24   $SRC_PNG --out $ANDROID_DIR/mipmap-mdpi/ic_stat_logo.png

sips -z 192 192   $CUR_DIR/ic_launcher.png --out $ANDROID_DIR/mipmap-xxxhdpi/ic_launcher.png
sips -z 432 432   $CUR_DIR/ic_launcher_adaptive_fore.png --out $ANDROID_DIR/mipmap-xxxhdpi/ic_launcher_adaptive_fore.png
sips -z 192 192   $CUR_DIR/ic_launcher_round.png --out $ANDROID_DIR/mipmap-xxxhdpi/ic_launcher_round.png
sips -z 432 432   $CUR_DIR/ic_launcher_round_adaptive_fore.png --out $ANDROID_DIR/mipmap-xxxhdpi/ic_launcher_round_adaptive_fore.png

sips -z 144 144   $CUR_DIR/ic_launcher.png --out $ANDROID_DIR/mipmap-xxhdpi/ic_launcher.png
sips -z 324 324   $CUR_DIR/ic_launcher_adaptive_fore.png --out $ANDROID_DIR/mipmap-xxhdpi/ic_launcher_adaptive_fore.png
sips -z 144 144   $CUR_DIR/ic_launcher_round.png --out $ANDROID_DIR/mipmap-xxhdpi/ic_launcher_round.png
sips -z 324 324   $CUR_DIR/ic_launcher_round_adaptive_fore.png --out $ANDROID_DIR/mipmap-xxhdpi/ic_launcher_round_adaptive_fore.png


sips -z 96 96   $CUR_DIR/ic_launcher.png --out $ANDROID_DIR/mipmap-xhdpi/ic_launcher.png
sips -z 216 216   $CUR_DIR/ic_launcher_adaptive_fore.png --out $ANDROID_DIR/mipmap-xhdpi/ic_launcher_adaptive_fore.png
sips -z 96 96   $CUR_DIR/ic_launcher_round.png --out $ANDROID_DIR/mipmap-xhdpi/ic_launcher_round.png
sips -z 216 216   $CUR_DIR/ic_launcher_round_adaptive_fore.png --out $ANDROID_DIR/mipmap-xhdpi/ic_launcher_round_adaptive_fore.png



sips -z 72 72   $CUR_DIR/ic_launcher.png --out $ANDROID_DIR/mipmap-hdpi/ic_launcher.png
sips -z 162 162   $CUR_DIR/ic_launcher_adaptive_fore.png --out $ANDROID_DIR/mipmap-hdpi/ic_launcher_adaptive_fore.png
sips -z 72 72   $CUR_DIR/ic_launcher_round.png --out $ANDROID_DIR/mipmap-hdpi/ic_launcher_round.png
sips -z 162 162   $CUR_DIR/ic_launcher_round_adaptive_fore.png --out $ANDROID_DIR/mipmap-hdpi/ic_launcher_round_adaptive_fore.png


sips -z 48 48   $CUR_DIR/ic_launcher.png --out $ANDROID_DIR/mipmap-mdpi/ic_launcher.png
sips -z 108 108   $CUR_DIR/ic_launcher_adaptive_fore.png --out $ANDROID_DIR/mipmap-mdpi/ic_launcher_adaptive_fore.png
sips -z 48 48   $CUR_DIR/ic_launcher_round.png --out $ANDROID_DIR/mipmap-mdpi/ic_launcher_round.png
sips -z 108 108   $CUR_DIR/ic_launcher_round_adaptive_fore.png --out $ANDROID_DIR/mipmap-mdpi/ic_launcher_round_adaptive_fore.png


sips -z 1024 1024   $SRC_PNG --out /Users/ton/Desktop/projects/ios/RTCPublisher/RTCPublisher/Assets.xcassets/AppIcon.appiconset/AppIcon.png


