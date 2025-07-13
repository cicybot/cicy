import { OpenAIFilled } from '@ant-design/icons';
import { Sender, Suggestion } from '@ant-design/x';
import type { GetProp } from 'antd';
import React from 'react';

type SuggestionItems = Exclude<GetProp<typeof Suggestion, 'items'>, () => void>;

const suggestions: SuggestionItems = [
    { label: 'Write a report', value: 'report' },
    { label: 'Draw a picture', value: 'draw' },
    {
        label: 'Check some knowledge',
        value: 'knowledge',
        icon: <OpenAIFilled />,
        children: [
            {
                label: 'About React',
                value: 'react'
            },
            {
                label: 'About Ant Design',
                value: 'antd'
            }
        ]
    }
];

const SuggestionView = ({ setMsg }: { setMsg: any }) => {
    const [value, setValue] = React.useState('');

    return (
        <Suggestion
            items={suggestions}
            onSelect={itemVal => {
                setValue(`[${itemVal}]:`);
            }}
            block
        >
            {({ onTrigger, onKeyDown }) => {
                return (
                    <Sender
                        onSubmit={() => {
                            console.log('onSubmit', value);
                            setMsg({
                                key: Math.floor(Date.now() / 1000),
                                role: 'user',
                                content: value
                            });
                            setValue('');
                        }}
                        value={value}
                        onChange={nextVal => {
                            if (nextVal === '/') {
                                onTrigger();
                            } else if (!nextVal) {
                                onTrigger(false);
                            }
                            setValue(nextVal);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="输入 / 获取建议"
                    />
                );
            }}
        </Suggestion>
    );
};

export default SuggestionView;
