import type { TEntitlement, TFeatures, TLicenseBlock } from '@n8n_io/license-sdk';
import { InstanceSettings, ObjectStoreService } from 'n8n-core';
import Container, { Service } from 'typedi';
import { Logger } from '@/Logger';
import config from '@/config';
import {
	LICENSE_FEATURES,
	LICENSE_QUOTAS,
	N8N_VERSION,
	SETTINGS_LICENSE_CERT_KEY,
	UNLIMITED_LICENSE_QUOTA,
} from './constants';
import { SettingsRepository } from '@db/repositories/settings.repository';
import type { BooleanLicenseFeature, N8nInstanceType, NumericLicenseFeature } from './Interfaces';
import type { RedisServicePubSubPublisher } from './services/redis/RedisServicePubSubPublisher';
import { RedisService } from './services/redis.service';
import { OrchestrationService } from '@/services/orchestration.service';
import { OnShutdown } from '@/decorators/OnShutdown';
import { UsageMetricsService } from './services/usageMetrics.service';

type FeatureReturnType = Partial<
	{
		planName: string;
	} & { [K in NumericLicenseFeature]: number } & { [K in BooleanLicenseFeature]: boolean }
>;

const features = {
	'planName': 'enterprise',
	'feat:sharing': true,
	'feat:ldap': true,
	'feat:saml': true,
	'feat:logStreaming': true,
	'feat:advancedExecutionFilters': true,
	'feat:variables': true,
	'feat:sourceControl': true,
	'feat:apiDisabled': true,
	'feat:externalSecrets': true,
	'feat:showNonProdBanner': false,
	'feat:workflowHistory': true,
	'feat:debugInEditor': true,
	'feat:binaryDataS3': true,
	'feat:multipleMainInstances': true,
	'feat:workerView': true,
	'feat:advancedPermissions': true,
	'quota:activeWorkflows': 10000,
	'quota:maxVariables': 1000,
	'quota:users': 1000,
	'quota:workflowHistoryPrune': 1000,
};

@Service()
export class License {
	private redisPublisher: RedisServicePubSubPublisher;

	private isShuttingDown = false;

	constructor(
		private readonly logger: Logger,
		private readonly instanceSettings: InstanceSettings,
		private readonly orchestrationService: OrchestrationService,
		private readonly settingsRepository: SettingsRepository,
		private readonly usageMetricsService: UsageMetricsService,
	) {}

	async init(instanceType: N8nInstanceType = 'main') {

	}

	async loadCertStr(): Promise<TLicenseBlock> {
		// if we have an ephemeral license, we don't want to load it from the database
		return 'loadCertStr'
	}

	async onFeatureChange(_features: TFeatures): Promise<void> {

	}

	async saveCertStr(value: TLicenseBlock): Promise<void> {

	}

	async activate(activationKey: string): Promise<void> {

	}

	async reload(): Promise<void> {

	}

	async renew() {
	}

	@OnShutdown()
	async shutdown() {
		// Shut down License manager to unclaim any floating entitlements
		// Note: While this saves a new license cert to DB, the previous entitlements are still kept in memory so that the shutdown process can complete
	
	}

	isFeatureEnabled(feature: BooleanLicenseFeature) {
		return features[feature] as boolean;
	}

	isSharingEnabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.SHARING);
	}

	isLogStreamingEnabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.LOG_STREAMING);
	}

	isLdapEnabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.LDAP);
	}

	isSamlEnabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.SAML);
	}

	isAdvancedExecutionFiltersEnabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS);
	}

	isAdvancedPermissionsLicensed() {
		return this.isFeatureEnabled(LICENSE_FEATURES.ADVANCED_PERMISSIONS);
	}

	isDebugInEditorLicensed() {
		return this.isFeatureEnabled(LICENSE_FEATURES.DEBUG_IN_EDITOR);
	}

	isBinaryDataS3Licensed() {
		return this.isFeatureEnabled(LICENSE_FEATURES.BINARY_DATA_S3);
	}

	isMultipleMainInstancesLicensed() {
		return this.isFeatureEnabled(LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES);
	}

	isVariablesEnabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.VARIABLES);
	}

	isSourceControlLicensed() {
		return this.isFeatureEnabled(LICENSE_FEATURES.SOURCE_CONTROL);
	}

	isExternalSecretsEnabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.EXTERNAL_SECRETS);
	}

	isWorkflowHistoryLicensed() {
		return this.isFeatureEnabled(LICENSE_FEATURES.WORKFLOW_HISTORY);
	}

	isAPIDisabled() {
		return this.isFeatureEnabled(LICENSE_FEATURES.API_DISABLED);
	}

	isWorkerViewLicensed() {
		return this.isFeatureEnabled(LICENSE_FEATURES.WORKER_VIEW);
	}

	getCurrentEntitlements() {
		return [

			{
				id: '1b765dc4-d39d-4ffe-9885-c56dd67c4b26',
				productId: '670650f2-72d8-4397-898c-c249906e2cc2',
				productMetadata: {
					terms: {
						isMainPlan: true,
					},
				},
				features: features,
				featureOverrides: {},
				validFrom: new Date(),
				validTo: new Date(),
			},
		];
	}

	getFeatureValue<T extends keyof FeatureReturnType>(feature: T): FeatureReturnType[T] {
		return features[feature] as FeatureReturnType[T];
	}

	getManagementJwt(): string {

		return 'sample jwt';
	}

	/**
	 * Helper function to get the main plan for a license
	 */
	getMainPlan(): TEntitlement | undefined {
		console.log('----------getMainPlan-------');
		return {
			id: 'abcd',
			productId: 'test',
			productMetadata: {
				hello: 'world'
			},
			features: features,
			featureOverrides: {
				hello: 'world'
			},
			validFrom: new Date(),
			validTo: new Date('2026-01-01'),
			isFloatable: true
		};
	}

	// Helper functions for computed data
	getUsersLimit() {
		return this.getFeatureValue(LICENSE_QUOTAS.USERS_LIMIT) ?? UNLIMITED_LICENSE_QUOTA;
	}

	getTriggerLimit() {
		return this.getFeatureValue(LICENSE_QUOTAS.TRIGGER_LIMIT) ?? UNLIMITED_LICENSE_QUOTA;
	}

	getVariablesLimit() {
		return this.getFeatureValue(LICENSE_QUOTAS.VARIABLES_LIMIT) ?? UNLIMITED_LICENSE_QUOTA;
	}

	getWorkflowHistoryPruneLimit() {
		return (
			this.getFeatureValue(LICENSE_QUOTAS.WORKFLOW_HISTORY_PRUNE_LIMIT) ?? UNLIMITED_LICENSE_QUOTA
		);
	}

	getPlanName(): string {
		return this.getFeatureValue('planName') ?? 'Community';
	}

	getInfo(): string {
		return 'getInfo';
	}

	isWithinUsersLimit() {
		return this.getUsersLimit() === UNLIMITED_LICENSE_QUOTA;
	}
}
