import { LoadingOutlined } from '@ant-design/icons';

const Loading = ({ size }: { size?: number }) => {
    return <LoadingOutlined style={{ fontSize: size || 44 }} />;
};
export default Loading;
