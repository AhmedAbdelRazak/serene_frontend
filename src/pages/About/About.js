import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";
import { getAbouts } from "../../apiCore";

const About = () => {
	const [aboutus, setAboutUs] = useState({});
	const [cleanedDescription, setCleanedDescription] = useState("");
	const [plainDescription, setPlainDescription] = useState("");
	const location = useLocation();

	const gettingAllAbouts = () => {
		getAbouts().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAboutUs(data[data.length - 1]);
			}
		});
	};

	useEffect(() => {
		gettingAllAbouts();
	}, []);

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(location.pathname + location.search);
	}, [location.pathname, location.search]);

	useEffect(() => {
		if (aboutus.description_1) {
			const cleanedDescription = aboutus.description_1.replace(/<br>/g, "");
			setCleanedDescription(cleanedDescription);
			const plainTextDescription = cleanedDescription.replace(/<[^>]+>/g, "");
			setPlainDescription(plainTextDescription);
		}
	}, [aboutus]);

	return (
		<AboutPageWrapper>
			{aboutus && aboutus.header_1 ? (
				<>
					<Helmet>
						<meta charSet='utf-8' />
						<title>Serene Jannat | About Us - {aboutus.header_1}</title>
						<meta
							name='description'
							content={`Discover the story behind Serene Jannat Gift Shop. Learn about our commitment to providing the best gifts, candles, and glass items to show love to your loved ones. Our customer-first approach ensures the highest level of satisfaction. ${plainDescription}`}
						/>
						<meta
							name='keywords'
							content='Serene Jannat, about us, gift shop, candles, glass items, customer-first, best gifts, gift store, our story, commitment, satisfaction'
						/>
						<meta
							property='og:title'
							content={`Serene Jannat | About Us - ${aboutus.header_1}`}
						/>
						<meta
							property='og:description'
							content={`Discover the story behind Serene Jannat Gift Shop. Learn about our commitment to providing the best gifts, candles, and glass items to show love to your loved ones. Our customer-first approach ensures the highest level of satisfaction. ${plainDescription}`}
						/>
						<meta property='og:image' content='%PUBLIC_URL%/logo192.png' />
						<meta property='og:url' content='https://serenejannat.com/about' />
						<meta property='og:type' content='website' />
						<meta property='og:locale' content='en_US' />
						<link rel='icon' href='gq_frontend/src/GeneralImgs/favicon.ico' />
						<link rel='canonical' href='https://serenejannat.com/about' />
					</Helmet>
					<div className='my-4'>
						<ImageWrapper>
							{aboutus &&
							aboutus.thumbnail &&
							aboutus.thumbnail[0] &&
							aboutus.thumbnail[0].url ? (
								<img
									src={aboutus.thumbnail[0].url}
									decoding='async'
									alt='Powered By infinite-apps.com'
									style={{
										marginTop: "0px",
										objectFit: "cover",
										padding: "0px",
									}}
								/>
							) : (
								<img
									decoding='async'
									alt='Powered By infinite-apps.com'
									style={{
										marginTop: "0px",
										objectFit: "cover",
										padding: "0px",
									}}
									src='https://reydemos.b-cdn.net/london/wp-content/uploads/sites/8/2019/04/our-story-01.jpg'
								/>
							)}
						</ImageWrapper>

						<DescriptionWrapper>
							<div className='about-us'>
								<p className='about-title' style={{ textAlign: "center" }}>
									{aboutus.header_1}
								</p>
								<CollapseContainer>
									<div
										dangerouslySetInnerHTML={{ __html: cleanedDescription }}
									/>
								</CollapseContainer>
							</div>
						</DescriptionWrapper>
					</div>
				</>
			) : null}
		</AboutPageWrapper>
	);
};

export default About;

const AboutPageWrapper = styled.section`
	background: var(--neutral-light);
	padding-bottom: 200px;
	overflow: hidden;

	.title {
		font-weight: bolder;
		color: var(--primary-color);
		margin-bottom: 15px;
	}

	.about-title {
		font-size: 40px;
		font-weight: 600;
		color: var(--accent-color-2);
		margin-left: 55px;

		@media (max-width: 1000px) {
			margin-top: 15px;
		}
	}

	.horizLine {
		border-bottom: var(--primary-color-dark) solid 5px;
		margin: 15px 0;
	}

	@media (max-width: 1000px) {
		text-align: center;
		padding-bottom: 0px;
		padding-top: 0px;

		.about-title {
			font-size: 40px;
			font-weight: 600;
			margin-top: 0%;
			color: var(--accent-color-2);
			margin-left: 0px;
		}
	}
`;

const ImageWrapper = styled.div`
	text-align: center;
	margin-bottom: 15px;

	img {
		width: 100%;
		max-width: 1028px;
		height: 40vh;
		border-radius: 8px;

		@media (max-width: 800px) {
			width: 100%;
			height: 100% !important;
			border-radius: 8px;
		}
	}
`;

const DescriptionWrapper = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 15px;
`;

const CollapseContainer = styled.div`
	width: 100%;
	max-width: 900px;
	margin: 15px auto;

	.ant-collapse-header {
		font-size: 1.5rem;
		color: var(--primary-color);
	}

	.ant-collapse-content {
		background-color: var(--background-light);
	}

	.ant-collapse-item {
		border-bottom: 1px solid var(--border-color-light);
	}

	.ant-collapse-arrow {
		color: var (--primary-color);
	}

	/* Add styles to reduce the spacing between paragraphs */
	p {
		margin: 0; /* Remove default margin */
		padding: 0.5em 0; /* Add some padding for space between paragraphs */
	}
`;
