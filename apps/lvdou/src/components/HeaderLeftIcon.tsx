import { CloseIcon } from '@cicy/app/dist/components/UI/CloseIcon';
import { useNavigate } from 'react-router';

export default function () {
    let navigate = useNavigate();

    const canBack = history.state && history.state.idx && history.state.idx > 0;
    return (
        <CloseIcon
            icon={canBack ? 'back' : 'home'}
            zIdx={1000}
            props={{
                top: 0,
                left: 12,
                wh: 44
            }}
            fontSize={18}
            onClick={() => {
                if (canBack) {
                    history.go(-1);
                } else {
                    navigate('/');
                }
            }}
        ></CloseIcon>
    );
}
