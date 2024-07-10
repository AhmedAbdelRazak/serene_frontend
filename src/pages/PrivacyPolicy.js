/** @format */

import React from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet";

const PrivacyPolicy = () => {
	const title = "Privacy Policy | Terms & Conditions | Serene Jannat";
	const description =
		"Learn about the privacy practices of Serene Jannat, your trusted online gift store for candles, glass items, and more.";
	const url = "https://serenejannat.com/privacy-policy-terms-conditions";
	const keywords =
		"Privacy Policy, Terms and Conditions, Serene Jannat, Online Shop, Candles, Gifts, blown glasses, decoration";

	return (
		<Wrapper>
			<Helmet>
				<title>{title}</title>
				<meta name='description' content={description} />
				<meta name='keywords' content={keywords} />
				<meta property='og:title' content={title} />
				<meta property='og:description' content={description} />
				<meta property='og:url' content={url} />
				<link
					rel='canonical'
					href='https://serenejannat.com/privacy-policy-terms-conditions'
				/>
				<meta property='og:type' content='website' />
			</Helmet>
			<ContentWrapper>
				<Title>Privacy Policy | Terms & Conditions</Title>
				{/* <SubTitle>Type of website: Gift Store Online Shop</SubTitle> */}
				<SectionTitle>Consent</SectionTitle>
				<Text>By using our Site users agree that they consent to:</Text>
				<List>
					<li>The conditions set out in this Privacy Policy; and</li>
					<li>
						The collection, use, and retention of the data listed in this
						Privacy Policy.
					</li>
				</List>
				<SectionTitle>Personal Data We Collect</SectionTitle>
				<Text>
					We only collect data that helps us achieve the purpose set out in this
					Privacy Policy. We will not collect any additional data beyond the
					data listed below without notifying you first.
				</Text>
				<SectionSubTitle>Data Collected in a Non-Automatic Way</SectionSubTitle>
				<Text>
					We may also collect the following data when you perform certain
					functions on our Site:
				</Text>
				<List>
					<li>First and last name;</li>
					<li>Email address; and</li>
					<li>Address.</li>
				</List>
				<Text>This data may be collected using the following methods:</Text>
				<List>
					<li>Creating an account.</li>
				</List>
				<SectionTitle>How We Use Personal Data</SectionTitle>
				<Text>
					Data collected on our Site will only be used for the purposes
					specified in this Privacy Policy or indicated on the relevant pages of
					our Site. We will not use your data beyond what we disclose in this
					Privacy Policy.
				</Text>
				<Text>
					The data we collect when the user performs certain functions may be
					used for the following purposes:
				</Text>
				<List>
					<li>For order processing.</li>
				</List>
				<SectionTitle>Who We Share Personal Data With</SectionTitle>
				<SectionSubTitle>Employees</SectionSubTitle>
				<Text>
					We may disclose user data to any member of our organization who
					reasonably needs access to user data to achieve the purposes set out
					in this Privacy Policy.
				</Text>
				<SectionSubTitle>Third Parties</SectionSubTitle>
				<Text>We may share user data with the following third parties:</Text>
				<List>
					<li>Square-Payment Processor.</li>
				</List>
				<Text>We may share the following user data with third parties:</Text>
				<List>
					<li>Credit Card information.</li>
				</List>
				<Text>
					We may share user data with third parties for the following purposes:
				</Text>
				<List>
					<li>Order processing secure payment gateway.</li>
				</List>
				<Text>
					Third parties will not be able to access user data beyond what is
					reasonably necessary to achieve the given purpose.
				</Text>
				<SectionSubTitle>Other Disclosures</SectionSubTitle>
				<Text>
					We will not sell or share your data with other third parties, except
					in the following cases:
				</Text>
				<List>
					<li>If the law requires it;</li>
					<li>If it is required for any legal proceeding;</li>
					<li>To prove or protect our legal rights; and</li>
					<li>
						To buyers or potential buyers of this company in the event that we
						seek to sell the company.
					</li>
				</List>
				<Text>
					If you follow hyperlinks from our Site to another Site, please note
					that we are not responsible for and have no control over their privacy
					policies and practices.
				</Text>
				<SectionTitle>How Long We Store Personal Data</SectionTitle>
				<Text>
					User data will be stored for one year. You will be notified if your
					data is kept for longer than this period.
				</Text>
				<SectionTitle>How We Protect Your Personal Data</SectionTitle>
				<Text>
					In order to protect your security, we use the strongest available
					browser encryption and store all of our data on servers in secure
					facilities. In order to secure our payment processing, we use Square
					payment gateway virtual terminal to process payments so no payment
					information is stored locally.
				</Text>
				<Text>
					While we take all reasonable precautions to ensure that user data is
					secure and that users are protected, there always remains the risk of
					harm. The Internet as a whole can be insecure at times and therefore
					we are unable to guarantee the security of user data beyond what is
					reasonably practical.
				</Text>
				<SectionTitle>Children</SectionTitle>
				<Text>
					We do not knowingly collect or use personal data from children under
					13 years of age. If we learn that we have collected personal data from
					a child under 13 years of age, the personal data will be deleted as
					soon as possible. If a child under 13 years of age has provided us
					with personal data their parent or guardian may contact our privacy
					officer.
				</Text>
				<SectionTitle>
					How to Access, Modify, Delete, or Challenge the Data Collected
				</SectionTitle>
				<Text>
					If you would like to know if we have collected your personal data, how
					we have used your personal data, if we have disclosed your personal
					data and to who we disclosed your personal data, or if you would like
					your data to be deleted or modified in any way, please contact our
					privacy officer here:
				</Text>
				<ContactInfo>
					Sally Abdelrazak
					<br />
					sally@serenejannat.com
					<br />
					(951) 565-7568
					<br />
					PO Box 322 674 Rocky Loop Crestline, CA 92325
				</ContactInfo>
				<SectionTitle>Do Not Track Notice</SectionTitle>
				<Text>
					Do Not Track ("DNT") is a privacy preference that you can set in
					certain web browsers. We do not track the users of our Site over time
					and across third party websites and therefore do not respond to
					browser-initiated DNT signals. We are not responsible for and cannot
					guarantee how any third parties who interact with our Site and your
					data will respond to DNT signals.
				</Text>
				<SectionTitle>Cookie Policy</SectionTitle>
				<Text>
					A cookie is a small file, stored on a user's hard drive by a website.
					Its purpose is to collect data relating to the user's browsing habits.
					You can choose to be notified each time a cookie is transmitted. You
					can also choose to disable cookies entirely in your internet browser,
					but this may decrease the quality of your user experience.
				</Text>
				<Text>We use the following types of cookies on our Site:</Text>
				<List>
					<li>Functional cookies</li>
				</List>
				<Text>
					Functional cookies are used to remember the selections you make on our
					Site so that your selections are saved for your next visits.
				</Text>
				<SectionTitle>Modifications</SectionTitle>
				<Text>
					This Privacy Policy may be amended from time to time in order to
					maintain compliance with the law and to reflect any changes to our
					data collection process. When we amend this Privacy Policy we will
					update the "Effective Date" at the top of this Privacy Policy. We
					recommend that our users periodically review our Privacy Policy to
					ensure that they are notified of any updates. If necessary, we may
					notify users by email of changes to this Privacy Policy.
				</Text>
				<SectionTitle>Contact Information</SectionTitle>
				<Text>
					If you have any questions, concerns or complaints, you can contact our
					privacy officer, Sally Abdelrazak, at:
				</Text>
				<ContactInfo>
					sally@serenejannat.com
					<br />
					(951) 565-7568
					<br />
					PO Box 322 674 Rocky Loop Crestline, CA 92325
				</ContactInfo>
			</ContentWrapper>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	background-color: var(--neutral-light);
	display: flex;
	justify-content: center;
	padding: 40px 20px;
	box-sizing: border-box;
	min-height: 100vh;
`;

const ContentWrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	max-width: 800px;
	background: white;
	padding: 40px;
	box-shadow: var(--box-shadow-light);
	border-radius: 8px;
`;

const Title = styled.h1`
	color: var(--text-color-dark);
	font-family: "SF Pro Display", sans-serif;
	font-size: 24px;
	font-weight: bold;
	margin-bottom: 20px;
	text-align: center;
`;

// eslint-disable-next-line
const SubTitle = styled.h2`
	color: var(--text-color-secondary);
	font-family: "SF Pro Display", sans-serif;
	font-size: 18px;
	font-weight: 600;
	margin-bottom: 10px;
	text-align: center;
`;

const SectionTitle = styled.h3`
	color: var(--text-color-primary);
	font-family: "SF Pro Display", sans-serif;
	font-size: 20px;
	font-weight: 600;
	margin-top: 20px;
	margin-bottom: 10px;
`;

const SectionSubTitle = styled.h4`
	color: var(--text-color-secondary);
	font-family: "SF Pro Display", sans-serif;
	font-size: 16px;
	font-weight: 600;
	margin-top: 15px;
	margin-bottom: 10px;
`;

const Text = styled.p`
	color: var(--text-color-primary);
	font-family: "SF Pro Display", sans-serif;
	font-size: 16px;
	line-height: 1.5;
	margin-bottom: 20px;
`;

const List = styled.ul`
	color: var(--text-color-primary);
	font-family: "SF Pro Display", sans-serif;
	font-size: 16px;
	line-height: 1.5;
	margin-bottom: 20px;
	padding-left: 20px;

	li {
		margin-bottom: 10px;
	}
`;

const ContactInfo = styled.div`
	color: var(--text-color-primary);
	font-family: "SF Pro Display", sans-serif;
	font-size: 16px;
	line-height: 1.5;
	margin-bottom: 20px;
`;

export default PrivacyPolicy;
