import { ReactNode } from 'react';
import View from './index';

const Block = ({ title, children }: { title?: string; children: ReactNode }) => {
    return (
        <View pb12>
            {title && (
                <View
                    userSelectNone
                    color={'var(--adm-color-weak)'}
                    fontSize={'var(--adm-font-size-7)'}
                    py={12}
                    pl12
                    borderBox
                >
                    {title}
                </View>
            )}
            <View>{children}</View>
        </View>
    );
};
export default Block;
