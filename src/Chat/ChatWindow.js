/** @format */
// ChatWindow.js (Marketplace) with Real Estate styling & functionality + storeId
// Fix: Removed local duplication in handleSendMessage

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input, Select, Form, Upload, message } from "antd";
import {
	createNewSupportCase,
	getSupportCaseById,
	updateSupportCase,
	updateSeenByCustomer,
	autoCompleteProducts,
	checkInvoiceNumber,
} from "../apiCore"; // Adjust path as needed
import styled, { keyframes } from "styled-components";
import socket from "./socket"; // Adjust path to your socket instance
import EmojiPicker from "emoji-picker-react";
import { UploadOutlined, CloseOutlined } from "@ant-design/icons";
import StarRatings from "react-star-ratings";
import { isAuthenticated } from "../auth";

const { Option } = Select;

// Inquiry types for your marketplace
const INQUIRY_TYPES = [
	{ value: "order", label: "Inquiry about an Order" },
	{ value: "product", label: "Inquiry about a Product" },
	{ value: "other", label: "Other Inquiry" },
];

const ChatWindow = ({ closeChatWindow, chosenLanguage }) => {
	// Basic user info
	const [customerName, setCustomerName] = useState("");
	const [customerEmail, setCustomerEmail] = useState("");

	// Inquiry states
	const [inquiryAbout, setInquiryAbout] = useState("");
	const [orderNumber, setOrderNumber] = useState("");
	const [productName, setProductName] = useState("");
	const [otherInquiry, setOtherInquiry] = useState("");
	const [storeId, setStoreId] = useState(null); // <--- track storeId

	// Chat/case states
	const [caseId, setCaseId] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");

	// UI extras
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [fileList, setFileList] = useState([]);
	const [typingStatus, setTypingStatus] = useState("");

	// Rating
	const [isRatingVisible, setIsRatingVisible] = useState(false);
	const [rating, setRating] = useState(0);

	// For auto-scrolling
	const messagesEndRef = useRef(null);

	// Product autocomplete suggestions
	const [productSuggestions, setProductSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	// NEW states/refs for controlling suggestions after selection
	const [hasSelectedProduct, setHasSelectedProduct] = useState(false);
	const selectedProductNameRef = useRef("");

	// -----------------------------
	// 1) On mount, load user & chat
	// -----------------------------
	useEffect(() => {
		// If user is authenticated, fill name/email
		if (isAuthenticated()) {
			const { user } = isAuthenticated();
			setCustomerName(user.name || "");
			setCustomerEmail(user.email || user.phone || "");
		}

		// Check localStorage for an existing chat
		const savedChat = JSON.parse(localStorage.getItem("currentChat")) || null;
		if (savedChat && savedChat.caseId) {
			setCaseId(savedChat.caseId);
			setCustomerName(savedChat.customerName || "");
			setCustomerEmail(savedChat.customerEmail || "");
			setInquiryAbout(savedChat.inquiryAbout || "");
			setOrderNumber(savedChat.orderNumber || "");
			setProductName(savedChat.productName || "");
			setOtherInquiry(savedChat.otherInquiry || "");
			setStoreId(savedChat.storeId || null);
			setSubmitted(savedChat.submitted || false);
			setMessages(savedChat.messages || []);
			// Fetch from DB
			fetchSupportCase(savedChat.caseId);
		}
	}, []);

	// -----------------------------
	// 2) Join/leave socket room
	// -----------------------------
	useEffect(() => {
		if (caseId) {
			socket.emit("joinRoom", { caseId });
		}
		return () => {
			if (caseId) {
				socket.emit("leaveRoom", { caseId });
			}
		};
	}, [caseId]);

	// -----------------------------
	// 3) Socket events
	// -----------------------------
	useEffect(() => {
		const handleReceiveMessage = (msgData) => {
			// Only add once
			if (msgData.caseId === caseId) {
				setMessages((prev) => [...prev, msgData]);
				markMessagesAsSeen(caseId);
			}
		};

		const handleCloseCase = (data) => {
			if (data?.case?._id === caseId) {
				setIsRatingVisible(true);
			}
		};

		const handleTyping = (info) => {
			if (info.caseId === caseId && info.user !== customerName) {
				setTypingStatus(`${info.user} is typing`);
			}
		};

		const handleStopTyping = (info) => {
			if (info.caseId === caseId && info.user !== customerName) {
				setTypingStatus("");
			}
		};

		socket.on("receiveMessage", handleReceiveMessage);
		socket.on("closeCase", handleCloseCase);
		socket.on("typing", handleTyping);
		socket.on("stopTyping", handleStopTyping);

		return () => {
			socket.off("receiveMessage", handleReceiveMessage);
			socket.off("closeCase", handleCloseCase);
			socket.off("typing", handleTyping);
			socket.off("stopTyping", handleStopTyping);
		};
	}, [caseId, customerName]);

	// -----------------------------
	// 4) Keep localStorage updated
	// -----------------------------
	useEffect(() => {
		if (caseId) {
			const saveChat = {
				caseId,
				customerName,
				customerEmail,
				inquiryAbout,
				orderNumber,
				productName,
				otherInquiry,
				storeId,
				submitted,
				messages,
			};
			localStorage.setItem("currentChat", JSON.stringify(saveChat));
			markMessagesAsSeen(caseId);
		}
	}, [
		caseId,
		customerName,
		customerEmail,
		inquiryAbout,
		orderNumber,
		productName,
		otherInquiry,
		storeId,
		submitted,
		messages,
	]);

	// -----------------------------
	// 5) Fetch existing case
	// -----------------------------
	const fetchSupportCase = async (id) => {
		try {
			if (!id) return;
			const supCase = await getSupportCaseById(id);
			if (supCase?.conversation) {
				setMessages(supCase.conversation);
			}
		} catch (err) {
			console.error("Error fetching support case:", err);
		}
	};

	// -----------------------------
	// 6) Mark messages as seen
	// -----------------------------
	const markMessagesAsSeen = async (id) => {
		try {
			await updateSeenByCustomer(id);
		} catch (err) {
			console.error("Error marking messages as seen:", err);
		}
	};

	// -----------------------------
	// 7) Scroll to bottom
	// -----------------------------
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, typingStatus]);

	// -----------------------------
	// 8) Autocomplete for product
	// -----------------------------
	useEffect(() => {
		const doFetch = async () => {
			// If user already selected a product, only show suggestions again
			// if the user has actually shortened (deleted from) the product name
			// AND still has at least 4 characters.
			if (hasSelectedProduct) {
				if (
					inquiryAbout === "product" &&
					productName.trim().length <
						selectedProductNameRef.current.trim().length &&
					productName.trim().length >= 4
				) {
					try {
						const suggestions = await autoCompleteProducts(productName.trim());
						setProductSuggestions(suggestions);
						setShowSuggestions(true);
						setHasSelectedProduct(false); // user changed/deleted text; revert back
					} catch (err) {
						console.error("Error auto-completing products:", err);
					}
					return;
				} else {
					// Keep them hidden if the user hasn't deleted letters,
					// or if the length is below 4, etc.
					setProductSuggestions([]);
					setShowSuggestions(false);
					return;
				}
			}

			// Original logic (unchanged) if user hasn't selected a product yet
			if (inquiryAbout === "product" && productName.trim().length >= 4) {
				try {
					const suggestions = await autoCompleteProducts(productName.trim());
					setProductSuggestions(suggestions);
					setShowSuggestions(true);
				} catch (err) {
					console.error("Error auto-completing products:", err);
				}
			} else {
				setProductSuggestions([]);
				setShowSuggestions(false);
			}
		};
		doFetch();
	}, [inquiryAbout, productName, hasSelectedProduct]);

	const handleSelectProduct = (prod) => {
		// On selecting from suggestions, state changes
		setProductName(prod.productName);
		setStoreId(prod.store || null);

		// Mark that a product has been selected; store its name
		selectedProductNameRef.current = prod.productName;
		setHasSelectedProduct(true);

		// Hide suggestions
		setShowSuggestions(false);
		setProductSuggestions([]);
	};

	// -----------------------------
	// 9) Check invoice for "order"
	// -----------------------------
	const checkOrderInvoice = async () => {
		if (!orderNumber.trim()) return;
		try {
			const result = await checkInvoiceNumber(orderNumber.trim());
			if (result.found) {
				setStoreId(result.storeId || null);
			} else {
				setStoreId(null);
			}
		} catch (err) {
			console.error("Error checking invoice:", err);
		}
	};

	// -----------------------------
	// 10) Create new support case
	// -----------------------------
	const handleSubmit = async () => {
		// 1) Validate name & email
		if (!customerName.trim() || !customerEmail.trim()) {
			message.error("Please enter your name and email/phone.");
			return;
		}

		// Force full name if not authenticated
		if (!isAuthenticated()) {
			const parts = customerName.trim().split(" ");
			if (parts.length < 2) {
				message.error("Please enter your full name (first and last).");
				return;
			}
		}

		// Check email/phone format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const phoneRegex = /^[0-9]{10,15}$/;
		if (!emailRegex.test(customerEmail) && !phoneRegex.test(customerEmail)) {
			message.error("Enter a valid email or phone.");
			return;
		}

		if (!inquiryAbout) {
			message.error("Select what your inquiry is about.");
			return;
		}

		// 2) Build inquiry details
		let detail = "";
		if (inquiryAbout === "order") {
			detail = orderNumber.trim();
			if (detail) await checkOrderInvoice();
		} else if (inquiryAbout === "product") {
			detail = productName.trim();
		} else {
			detail = otherInquiry.trim();
		}

		if (!detail) {
			message.error("Please provide details for your inquiry.");
			return;
		}

		// 3) Build final payload with storeId
		const payload = {
			customerName,
			customerEmail,
			displayName1: customerName,
			displayName2: "Platform Support",
			role: 0, // client role
			storeId: storeId || null,
			inquiryAbout,
			inquiryDetails: detail || "General Inquiry",
			supporterId: "606060606060606060606060",
			ownerId: "606060606060606060606060",
		};

		try {
			const newCase = await createNewSupportCase(payload);
			setCaseId(newCase._id);
			setSubmitted(true);

			if (newCase.conversation) {
				setMessages(newCase.conversation);
			} else {
				// Add a "System" message
				setMessages([
					{
						messageBy: { customerName: "System" },
						message: "A representative will be with you in 3-5 minutes.",
						date: new Date(),
					},
				]);
			}
		} catch (err) {
			console.error("Error creating support case:", err);
		}
	};

	// -----------------------------
	// 11) Send a message
	// -----------------------------
	const handleSendMessage = async () => {
		if (!newMessage.trim()) return;

		const msg = {
			caseId,
			messageBy: { customerName, customerEmail },
			message: newMessage,
			date: new Date(),
		};

		// *** Removed local append to avoid duplicates ***
		// setMessages((prev) => [...prev, msg]);

		try {
			// Update the DB (will trigger the server's "receiveMessage" broadcast)
			await updateSupportCase(caseId, { conversation: msg });
			// Then the "receiveMessage" event will add it to `messages`.
			socket.emit("sendMessage", msg);
			setNewMessage("");
			socket.emit("stopTyping", { caseId, user: customerName });
		} catch (err) {
			console.error("Error sending message:", err);
		}
	};

	// -----------------------------
	// 12) Close chat => rating
	// -----------------------------
	const handleCloseChat = () => {
		setIsRatingVisible(true);
	};

	const handleRateService = async (val) => {
		try {
			await updateSupportCase(caseId, {
				rating: val,
				caseStatus: "closed",
				closedBy: "client",
			});
			localStorage.removeItem("currentChat");
			setIsRatingVisible(false);
			closeChatWindow();
			message.success("Thanks for your feedback!");
		} catch (err) {
			console.error("Error rating support case:", err);
		}
	};

	const handleSkipRating = async () => {
		try {
			await updateSupportCase(caseId, {
				caseStatus: "closed",
				closedBy: "client",
			});
			localStorage.removeItem("currentChat");
			setIsRatingVisible(false);
			closeChatWindow();
		} catch (err) {
			console.error("Error skipping rating:", err);
		}
	};

	// -----------------------------
	// 13) Typing events
	// -----------------------------
	const handleInputChange = (e) => {
		setNewMessage(e.target.value);
		if (caseId) {
			socket.emit("typing", { caseId, user: customerName });
		}
	};

	const handleStopTyping = () => {
		if (caseId) {
			socket.emit("stopTyping", { caseId, user: customerName });
		}
	};

	// SHIFT+ENTER for multiline
	const handlePressEnter = (e) => {
		if (!e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// -----------------------------
	// 14) Emoji & file uploads
	// -----------------------------
	const handleEmojiClick = (emojiObj) => {
		setNewMessage((prev) => prev + emojiObj.emoji);
		setShowEmojiPicker(false);
	};

	const handleFileChange = ({ fileList: newList }) => {
		setFileList(newList);
	};

	// -----------------------------
	// 15) Utility: linkify
	// -----------------------------
	const renderLinks = useCallback((txt) => {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return txt.split(urlRegex).map((part, i) => {
			if (part.match(urlRegex)) {
				return (
					<a href={part} key={i} target='_blank' rel='noreferrer'>
						{part}
					</a>
				);
			}
			return part;
		});
	}, []);

	const isMine = (msg) => msg.messageBy?.customerEmail === customerEmail;

	// ==============================
	// Render
	// ==============================
	return (
		<ChatWindowWrapper>
			<Header>
				<h3>
					{chosenLanguage === "Arabic" ? "دعم العملاء" : "Customer Support"}
				</h3>
				<Button
					type='text'
					icon={<CloseOutlined />}
					onClick={closeChatWindow}
				/>
			</Header>

			{isRatingVisible ? (
				<RatingContainer>
					<h4>
						{chosenLanguage === "Arabic" ? "قيم خدمتنا" : "Rate Our Service"}
					</h4>
					<StarRatings
						rating={rating}
						starRatedColor='#faad14'
						changeRating={(val) => setRating(val)}
						numberOfStars={5}
						name='rating'
						starDimension='24px'
					/>
					<div className='rating-buttons'>
						<Button type='primary' onClick={() => handleRateService(rating)}>
							{chosenLanguage === "Arabic" ? "إرسال التقييم" : "Submit Rating"}
						</Button>
						<Button onClick={handleSkipRating}>
							{chosenLanguage === "Arabic" ? "تخطي" : "Skip"}
						</Button>
					</div>
				</RatingContainer>
			) : submitted ? (
				<>
					{/* Chat in progress */}
					<MessagesSection>
						{messages.map((msg, idx) => {
							const mine = isMine(msg);
							return (
								<MessageBubble key={idx} isMine={mine}>
									<strong>{msg.messageBy.customerName}:</strong>{" "}
									{renderLinks(msg.message)}
									<small>{new Date(msg.date).toLocaleString()}</small>
								</MessageBubble>
							);
						})}
						{typingStatus && (
							<TypingIndicator>
								<span className='typing-text'>{typingStatus}</span>
								<span className='dot'></span>
								<span className='dot'></span>
								<span className='dot'></span>
							</TypingIndicator>
						)}
						<div ref={messagesEndRef} />
					</MessagesSection>

					<Form.Item>
						<ChatInputContainer>
							<Input.TextArea
								placeholder={
									chosenLanguage === "Arabic"
										? "اكتب رسالتك..."
										: "Type your message..."
								}
								value={newMessage}
								onChange={handleInputChange}
								onBlur={handleStopTyping}
								autoSize={{ minRows: 1, maxRows: 6 }}
								onPressEnter={handlePressEnter}
							/>
							<Button onClick={() => setShowEmojiPicker((prev) => !prev)}>
								😀
							</Button>
							{showEmojiPicker && (
								<EmojiPickerWrapper>
									<EmojiPicker onEmojiClick={handleEmojiClick} />
								</EmojiPickerWrapper>
							)}
							<Upload
								fileList={fileList}
								onChange={handleFileChange}
								beforeUpload={() => false}
							>
								<Button icon={<UploadOutlined />} />
							</Upload>
						</ChatInputContainer>

						<Button
							type='primary'
							block
							onClick={handleSendMessage}
							style={{ marginTop: 8 }}
						>
							{chosenLanguage === "Arabic" ? "إرسال" : "Send"}
						</Button>
						<Button
							type='default'
							block
							onClick={handleCloseChat}
							style={{ marginTop: 8, background: "#ff4d4f", color: "#fff" }}
						>
							<CloseOutlined />{" "}
							{chosenLanguage === "Arabic" ? "إغلاق المحادثة" : "Close Chat"}
						</Button>
					</Form.Item>
				</>
			) : (
				// Initial Form
				<Form layout='vertical' onFinish={handleSubmit}>
					<Form.Item label='Full Name' required>
						<Input
							value={customerName}
							onChange={(e) => setCustomerName(e.target.value)}
							placeholder='FirstName LastName'
							disabled={isAuthenticated() && !!customerName}
							style={
								isAuthenticated() && customerName
									? { background: "#f5f5f5", color: "#666" }
									: undefined
							}
						/>
					</Form.Item>

					<Form.Item label='Email or Phone' required>
						<Input
							value={customerEmail}
							onChange={(e) => setCustomerEmail(e.target.value)}
							placeholder='client@example.com or 1234567890'
							disabled={isAuthenticated() && !!customerEmail}
							style={
								isAuthenticated() && customerEmail
									? { background: "#f5f5f5", color: "#666" }
									: undefined
							}
						/>
					</Form.Item>

					<Form.Item label='Inquiry About' required>
						<Select
							placeholder='Select an option'
							value={inquiryAbout || undefined}
							onChange={setInquiryAbout}
						>
							{INQUIRY_TYPES.map((opt) => (
								<Option key={opt.value} value={opt.value}>
									{opt.label}
								</Option>
							))}
						</Select>
					</Form.Item>

					{inquiryAbout === "order" && (
						<Form.Item label='Order/Invoice Number' required>
							<Input
								value={orderNumber}
								onChange={(e) => setOrderNumber(e.target.value)}
								placeholder='E.g. INV12345'
							/>
						</Form.Item>
					)}

					{inquiryAbout === "product" && (
						<Form.Item label='Product Name' required>
							<ProductInputWrapper>
								<Input
									value={productName}
									onChange={(e) => setProductName(e.target.value)}
									placeholder='Type at least 4 letters...'
								/>
								{showSuggestions && productSuggestions.length > 0 && (
									<SuggestionsList>
										{productSuggestions.map((prod) => (
											<SuggestionItem
												key={prod._id}
												onClick={() => handleSelectProduct(prod)}
											>
												<strong>{prod.productName}</strong>
												{prod.productSKU ? ` (SKU: ${prod.productSKU})` : ""}
											</SuggestionItem>
										))}
									</SuggestionsList>
								)}
							</ProductInputWrapper>
						</Form.Item>
					)}

					{inquiryAbout === "other" && (
						<Form.Item label='Brief Description' required>
							<Input
								value={otherInquiry}
								onChange={(e) => setOtherInquiry(e.target.value)}
								placeholder='Describe your inquiry'
							/>
						</Form.Item>
					)}

					<Button type='primary' htmlType='submit' block>
						{chosenLanguage === "Arabic" ? "بدء المحادثة" : "Start Chat"}
					</Button>
				</Form>
			)}
		</ChatWindowWrapper>
	);
};

export default ChatWindow;

/* ----------------- STYLED COMPONENTS ----------------- */

const ChatWindowWrapper = styled.div`
	position: fixed;
	bottom: 70px;
	right: 20px;
	width: 350px;
	max-width: 90%;
	height: 70vh;
	max-height: 80vh;
	background: #fff;
	border: 1px solid #ccc;
	border-radius: 8px;
	z-index: 1001;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
	padding: 20px;
	overflow: hidden;

	select,
	option,
	input,
	strong {
		text-transform: capitalize !important;
	}

	@media (max-width: 768px) {
		bottom: 85px;
		right: 5%;
		width: 90%;
		height: 80vh;
	}
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10px;
`;

const MessagesSection = styled.div`
	max-height: 55vh;
	margin-bottom: 10px;
	overflow-y: auto;
	scroll-behavior: smooth;
`;

const typingBounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
`;

const TypingIndicator = styled.div`
	display: flex;
	align-items: center;
	margin-top: 5px;

	.typing-text {
		margin-right: 8px;
		font-style: italic;
		color: #666;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #666;
		margin: 0 2px;
		animation: ${typingBounce} 1s infinite ease-in-out;
	}
	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}
`;

const MessageBubble = styled.div`
	margin-bottom: 8px;
	padding: 8px;
	border-radius: 6px;
	line-height: 1.4;
	background: ${(props) => (props.isMine ? "#d2f8d2" : "#f5f5f5")};

	strong {
		display: block;
		margin-bottom: 4px;
	}
	small {
		display: block;
		margin-top: 4px;
		font-size: 0.75rem;
		color: #888;
	}
`;

const RatingContainer = styled.div`
	text-align: center;

	.rating-buttons {
		margin-top: 16px;
		display: flex;
		justify-content: center;
		gap: 10px;
	}
`;

const ChatInputContainer = styled.div`
	display: flex;
	gap: 4px;

	textarea {
		flex: 1;
		resize: none;
	}
`;

const EmojiPickerWrapper = styled.div`
	position: absolute;
	bottom: 60px;
	right: 20px;
	z-index: 9999;
	background: #fff;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
`;

const ProductInputWrapper = styled.div`
	position: relative;
`;

const SuggestionsList = styled.ul`
	position: absolute;
	top: 38px;
	left: 0;
	right: 0;
	max-height: 180px;
	overflow-y: auto;
	background: #fff;
	border: 1px solid #ccc;
	list-style: none;
	margin: 0;
	padding: 0;
	z-index: 9999;
`;

const SuggestionItem = styled.li`
	padding: 8px 12px;
	cursor: pointer;
	&:hover {
		background-color: #eee;
	}
`;
