import React, { Fragment } from "react";
import ChatContainer from "../chat/chatbox";
import Navbar from "../navbar/navbar";

const AdaptiveWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <Fragment>
            <Navbar />
            {children}
            <ChatContainer />
        </Fragment>
    );
};

export default AdaptiveWrapper;
