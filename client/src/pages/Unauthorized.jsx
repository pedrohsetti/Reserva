import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Unauthorized.module.css';

/**
 * Unauthorized - Shows when user doesn't have permission to access a route
 */
const Unauthorized = ({ userRole }) => {
	const navigate = useNavigate();

	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<div className={styles.errorCode}>403</div>
				<h1 className={styles.title}>Unauthorized Access</h1>
				<p className={styles.message}>
					You don't have permission to access this page.
				</p>
				<p className={styles.details}>
					Your current role: <strong>{userRole}</strong>
				</p>
				<div className={styles.actions}>
					<button className={styles.primaryBtn} onClick={() => navigate('/')}>
						Go to Dashboard
					</button>
					<button className={styles.secondaryBtn} onClick={() => navigate(-1)}>
						Go Back
					</button>
				</div>
			</div>
		</div>
	);
};

export default Unauthorized;
