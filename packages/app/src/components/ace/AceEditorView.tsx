import ace from 'ace-builds';
import AceEditor, { IAceEditorProps, IAceOptions } from 'react-ace';

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-sh';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-monokai';
import { useEffect } from 'react';

ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.6/src-noconflict');
export type ACE_MODE = 'javascript' | 'markdown' | 'text' | 'json' | 'yaml' | 'sh' | 'python';

//https://mkslanc.github.io/ace-playground/
export function AceEditorView({
    defaultCode,
    mode,
    onChange,
    id,
    readOnly,
    options,
    value,
    props
}: {
    options?: IAceOptions;
    id: string;
    readOnly?: boolean;
    mode: ACE_MODE;
    defaultCode?: string;
    value?: string;
    onChange?: (code: string) => void;
    props?: Partial<IAceEditorProps>;
}) {
    useEffect(() => {
        if (mode !== 'javascript') {
            return;
        }
        // const GMethodsCompleter = {
        //     getCompletions: (
        //         editor: any,
        //         session: any,
        //         pos: any,
        //         prefix: string,
        //         callback: (
        //             error: null,
        //             completions: Array<{ caption: string; value: string; meta: string }>
        //         ) => void
        //     ) => {
        //         const GMethods = Object.getOwnPropertyNames(G).filter(
        //             method => typeof (G as any)[method] === 'function'
        //         );
        //
        //         const completions = GMethods.map(method => ({
        //             caption: method,
        //             value: GMethodSnapCodes[method] || `G.${method}()`,
        //             meta: 'local'
        //         }));
        //
        //         callback(null, completions);
        //     }
        // };
        // const langTools = (window as any).ace.require('ace/ext/language_tools');
        // langTools.addCompleter(GMethodsCompleter);
    }, []);

    return (
        <AceEditor
            mode={mode}
            readOnly={readOnly}
            theme="monokai"
            value={value}
            defaultValue={defaultCode}
            onChange={onChange}
            height={'100%'}
            fontSize={14}
            width={'100%'}
            highlightActiveLine={true}
            name={id}
            style={{
                letterSpacing: '1px'
            }}
            editorProps={{ $blockScrolling: true }}
            setOptions={{
                enableBasicAutocompletion: mode === 'javascript',
                enableLiveAutocompletion: mode === 'javascript',
                enableMobileMenu: mode === 'javascript',
                showLineNumbers: true,
                enableSnippets: mode === 'javascript',
                tabSize: 2,
                ...options
            }}
            {...props}
        />
    );
}
