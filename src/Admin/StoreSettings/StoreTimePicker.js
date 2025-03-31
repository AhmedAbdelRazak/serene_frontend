import React, { useEffect } from "react";
import moment from "moment";
import styled from "styled-components";

const StoreTimePicker = ({
	language,
	openTime,
	setOpenTime,
	closeTime,
	setCloseTime,
	allHours,
	setAllHours,
}) => {
	const possibleTimes = [
		"00:00",
		"01:00",
		"02:00",
		"03:00",
		"04:00",
		"05:00",
		"06:00",
		"07:00",
		"08:00",
		"09:00",
		"10:00",
		"11:00",
		"12:00",
		"13:00",
		"14:00",
		"15:00",
		"16:00",
		"17:00",
		"18:00",
		"19:00",
		"20:00",
		"21:00",
		"22:00",
		"23:00",
		"11:45",
	];

	const onOpenTimeChange = (e) => {
		setOpenTime(e.target.value);
	};

	const onCloseTimeChange = (e) => {
		setCloseTime(e.target.value);
	};

	useEffect(() => {
		if (!openTime || !closeTime) return;

		let currentTime = moment(openTime, "HH:mm");
		const times = [];
		const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
		const replaceArabicNumbers = (str) => {
			for (let i = 0; i <= 9; i++) {
				const regex = new RegExp(arabicNumbers[i], "g");
				str = str.replace(regex, i.toString());
			}
			return str;
		};

		while (currentTime.isSameOrBefore(moment(closeTime, "HH:mm"))) {
			let formattedTime = currentTime.format("HH:mm");
			formattedTime = replaceArabicNumbers(formattedTime);
			times.push(formattedTime);
			currentTime = currentTime.clone().add(15, "minutes");
		}

		setAllHours(times);

		// eslint-disable-next-line
	}, [openTime, closeTime]);

	const displayTimes = possibleTimes.map((time) => {
		const [hour] = time.split(":");
		if (time === "11:45") return { display: "11:45 مساءا", value: time };
		const display =
			hour < 12
				? `${hour} صباحا`
				: hour === 12
					? `12 مساءا`
					: `${hour - 12} مساءا`;
		return { display, value: time };
	});

	const displayTimesEnglish = possibleTimes.map((time) => {
		const [hour] = time.split(":");
		if (time === "11:45") return { display: "11:45 PM", value: time };
		const display =
			hour < 12 ? `${hour} AM` : hour === 12 ? `12 PM` : `${hour - 12} PM`;
		return { display, value: time };
	});

	// console.log(allHours, "allHours");
	// console.log(openTime, "openTime");
	// console.log(closeTime, "closeTime");

	return (
		<StoreTimePickerWrapper dir={language === "Arabic" ? "rtl" : "ltr"}>
			{language === "Arabic" ? (
				<div style={{ textAlign: "right" }}>
					<div>
						ساعات شحن التجارة الإلكترونية من{" "}
						<strong>"{allHours && allHours[0]}"</strong> إلى{" "}
						<strong>
							"{allHours && allHours[0] && allHours[allHours.length - 1]}"
						</strong>
					</div>
					<div className='row'>
						<div className='col-md-5'>
							<select
								value={openTime}
								onChange={onOpenTimeChange}
								className='mobile-scrollable-dropdown w-75 text-center my-2 form-control'
							>
								{displayTimes.map(({ display, value }, index) => (
									<option key={index} value={value}>
										{display}
									</option>
								))}
							</select>
						</div>

						<div className='col-md-5'>
							<select
								value={closeTime}
								onChange={onCloseTimeChange}
								disabled={!openTime}
								className='mobile-scrollable-dropdown w-75 text-center my-2 form-control'
							>
								{displayTimes
									.filter(({ value }) => value >= openTime)
									.map(({ display, value }, index) => (
										<option key={index} value={value}>
											{display}
										</option>
									))}
							</select>
						</div>
					</div>
				</div>
			) : (
				<>
					<div>
						E-commerce shipping hours from{" "}
						<strong>"{allHours && allHours[0]}"</strong> to{" "}
						<strong>
							"{allHours && allHours[0] && allHours[allHours.length - 1]}"
						</strong>
					</div>

					<div className='row'>
						<div className='col-md-5 '>
							<select
								value={openTime}
								onChange={onOpenTimeChange}
								className='w-75 text-center form-control'
							>
								{displayTimesEnglish.map(({ display, value }, index) => (
									<option key={index} value={value}>
										{display}
									</option>
								))}
							</select>
						</div>

						<div className='col-md-5'>
							<select
								value={closeTime}
								onChange={onCloseTimeChange}
								disabled={!openTime}
								className='mobile-scrollable-dropdown w-75 text-center my-2 form-control'
							>
								{displayTimesEnglish
									.filter(({ value }) => value >= openTime)
									.map(({ display, value }, index) => (
										<option key={index} value={value}>
											{display}
										</option>
									))}
							</select>
						</div>
					</div>
				</>
			)}
		</StoreTimePickerWrapper>
	);
};

export default StoreTimePicker;

const StoreTimePickerWrapper = styled.div`
	.mobile-scrollable-dropdown .ant-picker-dropdown {
		overflow: auto;
		max-height: 200px;
	}
`;
