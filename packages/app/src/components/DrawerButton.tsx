import React, { useState } from 'react';
import { View } from '../index';
import { Button, Drawer } from 'antd';
import type { ButtonType } from 'antd/es/button/buttonHelpers';

function DrawerButton(props: {
    buttonType?: ButtonType;
    children?: React.ReactNode;
    title?: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <View empty>
            <Button size={'small'} type={props.buttonType} onClick={() => setOpen(!open)}>
                {props.title || 'Btn'}
            </Button>

            <Drawer
                width={'60%'}
                title={props.title || 'Btn'}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setOpen(false);
                }}
                open={open}
            >
                {open && <View>{props.children}</View>}
            </Drawer>
        </View>
    );
}
export default DrawerButton;
