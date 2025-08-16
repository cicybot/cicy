import View from '../View';
import { LeftOutline } from 'antd-mobile-icons';

export const BackIcon = ({
    props,
    onClick,
    fontSize
}: {
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
            abs
            pointer
            {...props}
            center
            onClick={() => {
                onClick();
            }}
        >
            <LeftOutline style={{ fontSize }} />
        </View>
    );
};
