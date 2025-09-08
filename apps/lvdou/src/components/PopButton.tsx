import React, { CSSProperties, useState } from 'react';
import { View } from '@cicy/app';
import { Button, Popup } from 'antd-mobile';

function PopButton(props: {
    height?: number | string;
    size?: 'small' | 'large' | 'middle' | 'mini' | undefined;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | undefined;
    children?: React.ReactNode;
    position?: 'bottom' | 'top' | 'left' | 'right';
    title?: string;
    bodyStyle?: CSSProperties;
}) {
    const [open, setOpen] = useState(false);
    return (
        <View empty>
            <Button size={props.size} color={props.color} onClick={() => setOpen(!open)}>
                {props.title || 'Btn'}
            </Button>

            <Popup
                position={props.position}
                visible={open}
                onMaskClick={() => {
                    setOpen(false);
                }}
                onClose={() => {
                    setOpen(false);
                }}
                bodyStyle={{
                    height: props.height || '40vh',
                    ...props.bodyStyle
                }}
            >
                <View absFull>{open && props.children}</View>
            </Popup>

            {/*<Drawer*/}
            {/*    width={'60%'}*/}
            {/*    title={props.title || 'Btn'}*/}
            {/*    closable={{ 'aria-label': 'Close Button' }}*/}
            {/*    onClose={() => {*/}
            {/*        setOpen(false);*/}
            {/*    }}*/}
            {/*    open={open}*/}
            {/*>*/}
            {/*</Drawer>*/}
        </View>
    );
}
export default PopButton;
