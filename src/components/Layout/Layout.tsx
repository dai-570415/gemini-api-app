import { ReactNode } from 'react';

type Children = {
    children?: ReactNode;
};

// 通常レイアウト
export const Layout = ({ children }: Children) => {
    return (
        <div className="container">
            <main>
                {children}
            </main>
        </div>
    );
}
