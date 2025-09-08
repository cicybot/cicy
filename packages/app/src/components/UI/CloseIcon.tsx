import { CloseOutlined } from './Icons';
import { MdArrowBackIos } from 'react-icons/md';
import { FaHome } from 'react-icons/fa';

import View from '../View';

export const CloseIcon = ({
    props,
    icon,
    onClick,
    zIdx,
    fontSize
}: {
    icon?: 'LeftOutline' | 'home' | 'back';
    zIdx?: number;
    fontSize?: number;
    props: {
        top?: number;
        left?: number;
        right?: number;
        wh?: number;
    };
    onClick: () => void;
}) => {
    return (
        <View
            zIdx={zIdx || 1}
            abs
            pointer
            {...props}
            center
            fontWeight={700}
            onClick={() => {
                onClick();
            }}
        >
            {Boolean(icon && (icon === 'LeftOutline' || icon === 'back')) &&
                (() => {
                    //@ts-ignore
                    return <MdArrowBackIos style={{ width: 24, height: 24 }} />;
                })()}
            {Boolean(icon && icon === 'home') &&
                (() => {
                    //@ts-ignore
                    return <FaHome style={{ width: 24, height: 24 }} />;
                })()}
            {!icon && <CloseOutlined style={{ fontWeight: 700, fontSize }} />}
        </View>
    );
};
