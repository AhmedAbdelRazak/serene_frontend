// src/components/ChatIcon.js
import React, { useState } from "react";
import { Button } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ChatWindow from "./ChatWindow";
import styled from "styled-components";

const ChatIconWrapper = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	z-index: 1000;
`;

const StyledButton = styled(Button)`
	background-color: var(--primary-color);
	border: none;
`;

const ChatIcon = () => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleChatWindow = () => {
		setIsOpen(!isOpen);
	};

	return (
		<ChatIconWrapper>
			<StyledButton
				type='primary'
				shape='circle'
				icon={<MessageOutlined />}
				size='large'
				onClick={toggleChatWindow}
			/>
			{isOpen && <ChatWindow closeChatWindow={toggleChatWindow} />}
		</ChatIconWrapper>
	);
};

export default ChatIcon;
