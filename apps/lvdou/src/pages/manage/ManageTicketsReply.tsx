import UserMyOrderTickets from '../UserMyOrderTickets';
import { useGlobalContext } from '../../providers/GlobalProvider';
import { useAuthLogin } from '../../hooks/useAuthLogin';

const ManageTicketsReply = () => {
    const { state } = useGlobalContext();
    useAuthLogin();
    if (!state.authUser) {
        return null;
    }
    return <UserMyOrderTickets isAdmin />;
};

export default ManageTicketsReply;
