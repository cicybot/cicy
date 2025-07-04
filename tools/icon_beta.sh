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

SRC_PNG=$PROJECT_DIR/apps/desktop/public/icon@2x_beta.png
DESKTOP_DIR=$PROJECT_DIR/apps/desktop/public
DISCOVER_WEB_DIR=$PROJECT_DIR/apps/web3-desk/public


echo PROJECT_DIR: $PROJECT_DIR
echo DESKTOP_DIR: $DESKTOP_DIR

cd ${DESKTOP_DIR}

sips -z 44 44   $SRC_PNG --out tray-icon@2x.png
sips -z 22 22   $SRC_PNG --out tray-icon.png

rm -rf icon.iconset
mkdir -p icon.iconset

sips -z 1024 1024   $SRC_PNG --out icon.iconset/icon_512x512@2x.png



## convert icon.iconset to icon.icns
iconutil -c icns icon.iconset

rm -rf icon.iconset
