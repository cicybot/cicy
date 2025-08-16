import { CloseOutlined } from './Icons';
import View from '../View';

export const CloseIcon = ({
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
            <CloseOutlined style={{ fontSize }} />
        </View>
    );
};
