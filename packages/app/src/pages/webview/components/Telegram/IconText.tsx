import React from 'react';

const IconText = ({ icon, text, onClick }: { onClick?: () => void; icon: any; text: string }) => (
    <span style={{ marginLeft: 12, cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
        {React.createElement(icon, { style: { marginInlineEnd: 8 } })}
        {text}
    </span>
);
export default IconText;
