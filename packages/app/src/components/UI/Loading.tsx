import { LoadingOutlined } from '@ant-design/icons';

const Loading = ({ size, color }: { color?: string; size?: number }) => {
    return <LoadingOutlined style={{ color: color, fontSize: size || 44 }} />;
};
export default Loading;
