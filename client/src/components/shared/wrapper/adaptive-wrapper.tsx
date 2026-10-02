import React, { Fragment } from "react";

import ChatContainer from "../../../features/chat/components/chatbox";
import Navbar from "../navbar/navbar";

const AdaptiveWrapper = ({
    children,
    mobileDashboardNav = false,
}: {
    children: React.ReactNode;
    mobileDashboardNav?: boolean;
}) => {
    return (
        <Fragment>
            <Navbar />
            {children}
            <ChatContainer mobileDashboardNav={mobileDashboardNav} />
        </Fragment>
    );
};

export default AdaptiveWrapper;
