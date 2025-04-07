import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button } from "antd";
import ReactGA from "react-ga4";
import AnimationKickoff from "./pages/MyAnimationComponents/AnimationKickoff";

export default function ModalApp({ shouldHideLayout, location }) {
	const [isModalVisible, setIsModalVisible] = useState(false);

	// Track user's action for specialized animation: "YES" or "NO"
	const [action, setAction] = useState(null);

	// One-time modal logic
	useEffect(() => {
		if (shouldHideLayout) return;
		if (location.pathname.includes("custom")) return;
		const hasSeenModal = localStorage.getItem("customGiftModalDismissed");
		if (hasSeenModal) return;
		if (location.pathname.includes("/checkout")) return;

		const timer = setTimeout(() => {
			setIsModalVisible(true);
		}, 1500);
		return () => clearTimeout(timer);
	}, [location, shouldHideLayout]);

	// User clicks YES => specialized "jump & laugh" animation, then redirect
	const handleYes = () => {
		localStorage.setItem("customGiftModalDismissed", "true");
		localStorage.setItem("customGiftModalDismissed2", "Yes");
		ReactGA.event({
			category: "Custom Gift Modal",
			action: "User clicked YES - show me /custom-gifts",
		});
		setAction("YES");
	};

	// User clicks NO => specialized "it's ok" animation, then close
	const handleNo = () => {
		localStorage.setItem("customGiftModalDismissed", "true");
		localStorage.setItem("customGiftModalDismissed2", "No");

		ReactGA.event({
			category: "Custom Gift Modal",
			action: "User clicked NO - not interested",
		});
		setAction("NO");
	};

	// Callback from child that indicates the yes/no animation is done
	const onSpecialAnimationEnd = useCallback(() => {
		if (action === "YES") {
			// Redirect
			window.location.href = "/custom-gifts";
		} else if (action === "NO") {
			// Close modal
			setIsModalVisible(false);
		}
		setAction(null);
	}, [action]);

	// eslint-disable-next-line
	const modalText =
		"Your loved ones deserve just 3 minutes of your time to create their perfect gift. Click below to be unique! ❤️😉";

	return (
		<Modal
			className='sereneModal'
			open={isModalVisible}
			onCancel={handleNo}
			closable={false}
			footer={null}
			style={{ height: "19%" }}
			centered
			maskClosable={false} // prevent closing unless they pick yes/no
			styles={{
				mask: {
					backgroundColor: "rgba(0,0,0,0.9)", // darker overlay
				},
			}}
		>
			{/* 
        Container for both the watermark and the content 
        so the watermark can sit behind everything 
      */}
			<div className='sereneModalContainer'>
				{/* The diagonal watermark text */}
				<div className='sereneWatermark'>SERENE</div>
				<div className='sereneWatermark2'>SERENE</div>

				<div className='sereneModalContent' style={{ position: "relative" }}>
					{/* Absolutely-position the animation near the top-left corner */}
					<div className='animationStylingWrapper'>
						<AnimationKickoff
							action={action}
							onSpecialAnimationEnd={onSpecialAnimationEnd}
						/>
					</div>

					{/* 
            <p
              style={{
                fontSize: "1.1rem",
                textAlign: "center",
                margin: "20px 0 10px 0",
              }}
            >
              {modalText}
            </p> 
          */}

					<div className='modalButtonWrapper'>
						<Button
							type='primary'
							style={{ marginRight: 10 }}
							onClick={handleYes}
						>
							Yes, Let’s Do It!
						</Button>
						<Button onClick={handleNo}>No, Thank You</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
