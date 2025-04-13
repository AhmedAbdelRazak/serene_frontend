import React, { useEffect, useState, useCallback } from "react";
import SVGChildPODWalkThrough from "./SVGChildPODWalkThrough";
import { Select } from "antd";
const { Option } = Select;

export default function AnimationPODWalkThrough({
	// Flags from the parent
	userAddedText,
	userAddedImage,
	userAddedToCart,
	isSomethingSelected,
	userJustDoubleClickedCanvas,
	userJustSingleClickedText,
	hasMultipleSizeOrColor,

	// For color & size
	colorOptions = [],
	sizeOptions = [],
	selectedColor,
	selectedSize,
	onHandleColorChange,
	onHandleSizeChange,

	// Main actions
	onUserAddToCart,
	onUserUploadPhoto, // <-- must be a function!
}) {
	const [xPos, setXPos] = useState(0);
	const [frameIndex, setFrameIndex] = useState(0); // 0..3=walk, 4=stand, 5=point arrow
	const [shouldFadeOut, setShouldFadeOut] = useState(false);

	// top-level steps
	const [stepIndex, setStepIndex] = useState(0);

	// sub-step for styling text
	const [subStep2, setSubStep2] = useState(0);
	const [isSubStep2_0FadingOut, setIsSubStep2_0FadingOut] = useState(false);

	const goToStep = useCallback((nextStep) => {
		setStepIndex(nextStep);
		resetBubble();
	}, []);

	// bubble content
	const [bubbleText, setBubbleText] = useState("");
	const [bubbleButtons, setBubbleButtons] = useState(null);
	const [bubbleUI, setBubbleUI] = useState(null);
	const [overrideFrame, setOverrideFrame] = useState(null);

	const isMobile = window.innerWidth < 768;

	// A) “walk in”
	useEffect(() => {
		setXPos(0);
		const t1 = setTimeout(() => setXPos(isMobile ? 150 : 300), 150);

		let cycle = 0;
		const interval = setInterval(() => {
			cycle = (cycle + 1) % 4;
			setFrameIndex(cycle); // 0..3 => walking
		}, 350);

		// after 2.1s => stand
		const t2 = setTimeout(() => {
			clearInterval(interval);
			setFrameIndex(4); // stand
		}, 2100);

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
			clearInterval(interval);
		};
	}, [isMobile]);

	function fadeOutCharacter() {
		setShouldFadeOut(true);
	}
	function resetBubble() {
		setBubbleText("");
		setBubbleButtons(null);
		setBubbleUI(null);
		setOverrideFrame(null);
	}

	// Hide if step≥7 or user is selecting
	const [forceHidden, setForceHidden] = useState(false);
	useEffect(() => {
		if (stepIndex >= 7) {
			setForceHidden(true);
			return;
		}
		if (isSomethingSelected) {
			setForceHidden(true);
		} else {
			setForceHidden(false);
		}
	}, [stepIndex, isSomethingSelected]);

	/**
	 * ----------------------------------------------------------------
	 * STEP 0 => "Would you like me to guide you?"
	 * ----------------------------------------------------------------
	 */
	useEffect(() => {
		if (frameIndex === 4 && stepIndex === 0) {
			setBubbleText("Would you like me to guide you?");
			setBubbleButtons(["Yes", "No"]);
		}
	}, [frameIndex, stepIndex]);

	/**
	 * ----------------------------------------------------------------
	 * STEP 1 => "Double-click anywhere to add text!"
	 * ----------------------------------------------------------------
	 */
	useEffect(() => {
		if (stepIndex === 1) {
			setBubbleText("Double-click anywhere to add your text!");
			setBubbleButtons(["Done", "Skip"]);
			setOverrideFrame(5); // arrow
		}
	}, [stepIndex]);

	// If user double-clicked => hide text => wait for user to add text
	useEffect(() => {
		if (stepIndex === 1 && userJustDoubleClickedCanvas) {
			setBubbleText("");
		}
	}, [stepIndex, userJustDoubleClickedCanvas]);

	// Once user has actually added text => step2
	useEffect(() => {
		if (stepIndex === 1 && userAddedText) {
			goToStep(2);
		}
	}, [stepIndex, userAddedText, goToStep]);

	/**
	 * ----------------------------------------------------------------
	 * STEP 2 => subStep2=0 => "Great! Let’s style your text!" => no buttons
	 *       after 1.5s => fade => subStep2=1 => "Single-click text" => [Done, Skip]
	 * ----------------------------------------------------------------
	 */
	useEffect(() => {
		if (stepIndex === 2) {
			// subStep2=0
			setSubStep2(0);
			setBubbleText("Great! Let’s style your text!");
			setBubbleButtons(null);
			setBubbleUI(null);
			setOverrideFrame(5);

			const t1 = setTimeout(() => setIsSubStep2_0FadingOut(true), 1500);

			const t2 = setTimeout(() => {
				setSubStep2(1);
				setBubbleText("Single-click your text to open the styling toolbar.");
				setBubbleButtons(["Done", "Skip"]);
				setOverrideFrame(5);
				setIsSubStep2_0FadingOut(false);
			}, 2100);

			return () => {
				clearTimeout(t1);
				clearTimeout(t2);
			};
		}
	}, [stepIndex]);

	// If user single-clicks text in subStep2=1, we do NOT skip automatically.
	// They must press “Done” or “Skip” in the bubble to proceed.

	/**
	 * ----------------------------------------------------------------
	 * STEP 3 => If multiple size/color => "Now pick a size & color" => [Done, Skip]
	 * ----------------------------------------------------------------
	 */
	useEffect(() => {
		if (stepIndex === 3) {
			if (!hasMultipleSizeOrColor) {
				// skip if no multiple color/size
				goToStep(4);
				return;
			}
			setBubbleText("Now pick a size & color if you’d like!");
			setOverrideFrame(5);

			// inline UI for color/size
			const inlineUI = (
				<div style={{ marginTop: 40, paddingBottom: 6 }}>
					<div style={{ marginBottom: 6 }}>
						<label style={{ marginRight: 4 }}>Color:</label>
						<Select
							style={{ width: 120 }}
							value={selectedColor}
							onChange={(val) =>
								onHandleColorChange && onHandleColorChange(val)
							}
						>
							{colorOptions.map((clr) => (
								<Option key={clr} value={clr}>
									{clr}
								</Option>
							))}
							{/* fallback if parent's selectedColor is not in colorOptions */}
							{!colorOptions.includes(selectedColor) && selectedColor && (
								<Option value={selectedColor}>{selectedColor}</Option>
							)}
						</Select>
					</div>
					<div style={{ marginBottom: 8 }}>
						<label style={{ marginRight: 4 }}>Size:</label>
						<Select
							style={{ width: 120 }}
							value={selectedSize}
							onChange={(val) => onHandleSizeChange && onHandleSizeChange(val)}
						>
							{sizeOptions.map((sz) => (
								<Option key={sz} value={sz}>
									{sz}
								</Option>
							))}
							{!sizeOptions.includes(selectedSize) && selectedSize && (
								<Option value={selectedSize}>{selectedSize}</Option>
							)}
						</Select>
					</div>
				</div>
			);
			setBubbleUI(inlineUI);
			setBubbleButtons(["Done", "Skip"]);
		}
	}, [
		stepIndex,
		hasMultipleSizeOrColor,
		selectedColor,
		selectedSize,
		colorOptions,
		sizeOptions,
		onHandleColorChange,
		onHandleSizeChange,
		goToStep,
	]);

	/**
	 * ----------------------------------------------------------------
	 * STEP 4 => "Would you like to add a photo?" => [Yes, No]
	 * ----------------------------------------------------------------
	 */
	useEffect(() => {
		if (stepIndex === 4) {
			setOverrideFrame(null);
			setBubbleText("Would you like to add a photo?");
			setBubbleButtons(["Yes", "No"]);
			setBubbleUI(null);
		}
	}, [stepIndex]);

	// If user actually added an image => step5
	useEffect(() => {
		if (stepIndex === 4 && userAddedImage) {
			goToStep(5);
		}
	}, [stepIndex, userAddedImage, goToStep]);

	/**
	 * ----------------------------------------------------------------
	 * STEP 5 => "Reposition or resize your design!" => [Done, Skip]
	 * ----------------------------------------------------------------
	 */
	useEffect(() => {
		if (stepIndex === 5) {
			setOverrideFrame(null);
			setBubbleText("Position or resize your design as you like!");
			setBubbleButtons(["Done", "Skip"]);
			setBubbleUI(null);
		}
	}, [stepIndex]);

	/**
	 * ----------------------------------------------------------------
	 * STEP 6 => "All set? Ready to check out?" => [Yes]
	 * ----------------------------------------------------------------
	 */
	useEffect(() => {
		if (stepIndex === 6) {
			setOverrideFrame(null);
			setBubbleText("All set? Ready to check out?");
			setBubbleButtons(["Yes"]);
			setBubbleUI(null);
		}
	}, [stepIndex]);

	// Step7 => fade => final big "Add to Cart" button
	const [showCartButton, setShowCartButton] = useState(false);
	useEffect(() => {
		if (stepIndex === 7) {
			setShouldFadeOut(true);
			const t = setTimeout(() => setShowCartButton(true), 1200);
			return () => clearTimeout(t);
		}
	}, [stepIndex]);

	// If user added to cart => fade out
	useEffect(() => {
		if (userAddedToCart) {
			fadeOutCharacter();
		}
	}, [userAddedToCart]);

	// handle bubble button clicks
	function handleBubbleButtonClick(label) {
		// Step0 => yes/no
		if (stepIndex === 0) {
			if (label === "Yes") {
				goToStep(1);
			} else {
				setBubbleText("No worries—good luck!");
				setBubbleButtons(null);
				setTimeout(() => fadeOutCharacter(), 1500);
			}
			return;
		}

		// Step1 => [Done, Skip] => step2
		if (stepIndex === 1) {
			goToStep(2);
			return;
		}

		// Step2 => if subStep2=1 => [Done, Skip] => step3
		if (stepIndex === 2 && subStep2 === 1) {
			goToStep(3);
			return;
		}

		// Step3 => [Done, Skip] => step4
		if (stepIndex === 3) {
			goToStep(4);
			return;
		}

		// Step4 => "Add photo?" => yes/no
		if (stepIndex === 4) {
			if (label === "Yes") {
				// show a quick UI => “Upload Photo” or “Skip”
				setBubbleText("");
				setBubbleButtons(null);
				setBubbleUI(renderUploadPhotoUI());
			} else {
				goToStep(5);
			}
			return;
		}

		// Step5 => [Done, Skip] => step6
		if (stepIndex === 5) {
			goToStep(6);
			return;
		}

		// Step6 => [Yes] => step7 => fade => final "Add to Cart" button
		if (stepIndex === 6) {
			goToStep(7);
		}
	}

	// UI for "Upload Photo"
	function renderUploadPhotoUI() {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "8px",
				}}
			>
				<button
					style={{
						padding: "6px 12px",
						border: "none",
						borderRadius: "4px",
						background: "#444",
						color: "#fff",
					}}
					onClick={() => {
						console.log("CHILD: Upload Photo button clicked (bubble)!");
						onUserUploadPhoto();
					}}
				>
					Upload Photo
				</button>
				<button
					style={{
						padding: "6px 12px",
						border: "none",
						borderRadius: "4px",
						background: "#888",
						color: "#fff",
					}}
					onClick={() => goToStep(5)}
				>
					Skip
				</button>
			</div>
		);
	}

	// render
	const hideCharacter = shouldFadeOut || forceHidden;
	const finalFrameIndex = overrideFrame != null ? overrideFrame : frameIndex;

	// If we’re fading out the first subStep2 text
	const bubbleTextStyle =
		stepIndex === 2 && subStep2 === 0 && isSubStep2_0FadingOut
			? { transition: "opacity 0.6s", opacity: 0 }
			: {};

	return (
		<div style={{ width: "100%", position: "relative" }}>
			{/* Step7 => "Add to Cart" button at left */}
			{showCartButton && (
				<div
					className='addCartWrapper'
					style={{
						position: "absolute",
						left: 0,
						bottom: 120,
						transform: `translateX(${isMobile ? 150 : 300}px)`,
					}}
				>
					<button
						style={{
							padding: "8px 16px",
							fontSize: "1rem",
							background: "#4CAF50",
							color: "#fff",
							border: "none",
							borderRadius: "4px",
							width: "200px",
						}}
						onClick={() => onUserAddToCart && onUserAddToCart()}
					>
						Add Design to Cart
					</button>
				</div>
			)}

			{!hideCharacter && (
				<div
					style={{
						position: "absolute",
						bottom: 20,
						left: 0,
						transform: `translateX(${xPos}px)`,
						transition: "transform 2s linear",
					}}
				>
					<SVGChildPODWalkThrough
						frameIndex={finalFrameIndex}
						bubbleText={bubbleText}
						bubbleButtons={bubbleButtons}
						bubbleUI={bubbleUI}
						isMobile={isMobile}
						onBubbleButtonClick={handleBubbleButtonClick}
						shouldFadeOut={shouldFadeOut}
						bubbleTextStyle={bubbleTextStyle}
					/>
				</div>
			)}
		</div>
	);
}
