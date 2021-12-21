'use strict';

TABS.configuration = {
    analyticsChanges: {},
};

TABS.configuration.initialize = function (callback) {
    const self = this;

    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';
        GUI.configuration_loaded = true;
    }

    function load_serial_config() {
        mspHelper.loadSerialConfig(load_config);
    }

    function load_config() {
        MSP.promise(MSPCodes.MSP_STATUS)
        .then(() => { return MSP.promise(MSPCodes.MSP_ADVANCED_CONFIG); })
        .then(() => { return MSP.promise(MSPCodes.MSP_FEATURE_CONFIG); })
        .then(() => { return MSP.promise(MSPCodes.MSP_BOARD_ALIGNMENT_CONFIG); })
        .then(() => { return MSP.promise(MSPCodes.MSP_ACC_TRIM); })
        .then(() => { return semver.lt(FC.CONFIG.apiVersion, API_VERSION_1_33) ? MSP.promise(MSPCodes.MSP_MISC) : true; })
        .then(() => { return semver.gte(FC.CONFIG.apiVersion, "1.8.0") ? MSP.promise(MSPCodes.MSP_ARMING_CONFIG) : true; })
        .then(() => { return semver.gte(FC.CONFIG.apiVersion, "1.17.0") ? MSP.promise(MSPCodes.MSP_RC_DEADBAND) : true; })
        .then(() => { return semver.gte(FC.CONFIG.apiVersion, "1.16.0") ? MSP.promise(MSPCodes.MSP_SENSOR_CONFIG) : true; })
        .then(() => { return semver.gte(FC.CONFIG.apiVersion, "1.15.0") ? MSP.promise(MSPCodes.MSP_SENSOR_ALIGNMENT) : true; })
        .then(() => { return semver.gte(FC.CONFIG.apiVersion, "1.20.0") ? MSP.promise(MSPCodes.MSP_NAME) : true; })
        .then(() => { return semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_31) ? MSP.promise(MSPCodes.MSP_RX_CONFIG) : true; })
        .then(() => { load_html(); });
    }

    function load_html() {
        $('#content').load("./tabs/configuration.html", process_html);
    }

    load_serial_config();

    function process_html() {
        self.analyticsChanges = {};

        // Hide the buttons toolbar
        $('.tab-configuration').addClass('toolbar_hidden');

        const features_e = $('.tab-configuration .features');

        FC.FEATURE_CONFIG.features.generateElements(features_e);

        // translate to user-selected language
        i18n.localizePage();

        let toolbarHidden = true;

        function showToolbar() {
            if (toolbarHidden) {
                toolbarHidden = false;
                $('.tab-configuration').removeClass('toolbar_hidden');
            }
        }

        const alignments = [
            'CW 0°',
            'CW 90°',
            'CW 180°',
            'CW 270°',
            'CW 0° flip',
            'CW 90° flip',
            'CW 180° flip',
            'CW 270° flip',
        ];

        if (semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_42)) {
            alignments.push('Custom');
        }

        const gyro_align_content_e = $('.tab-configuration .gyro_align_content');
        const legacy_gyro_alignment_e = $('.tab-configuration .legacy_gyro_alignment');
        const legacy_accel_alignment_e = $('.tab-configuration .legacy_accel_alignment');

        const orientation_gyro_e = $('select.gyroalign');
        const orientation_acc_e = $('select.accalign');
        const orientation_mag_e = $('select.magalign');

        const orientation_gyro_to_use_e = $('select.gyro_to_use');
        const orientation_gyro_1_align_e = $('select.gyro_1_align');
        const orientation_gyro_2_align_e = $('select.gyro_2_align');

        gyro_align_content_e.hide(); // default value
        if (semver.lt(FC.CONFIG.apiVersion, "1.15.0")) {
            $('.tab-configuration .sensoralignment').hide();
        } else {

            for (let i = 0; i < alignments.length; i++) {
                orientation_gyro_e.append(`<option value="${(i+1)}">${alignments[i]}</option>`);
                orientation_acc_e.append(`<option value="${(i+1)}">${alignments[i]}</option>`);
                orientation_mag_e.append(`<option value="${(i+1)}">${alignments[i]}</option>`);
            }

            orientation_gyro_e.val(FC.SENSOR_ALIGNMENT.align_gyro);
            orientation_acc_e.val(FC.SENSOR_ALIGNMENT.align_acc);
            orientation_mag_e.val(FC.SENSOR_ALIGNMENT.align_mag);

            orientation_gyro_e.change(function () {
                let value = parseInt($(this).val());

                let newValue = undefined;
                if (value !== FC.SENSOR_ALIGNMENT.align_gyro) {
                    newValue = $(this).find('option:selected').text();
                }
                self.analyticsChanges['GyroAlignment'] = newValue;

                FC.SENSOR_ALIGNMENT.align_gyro = value;
            });

            orientation_acc_e.change(function () {
                let value = parseInt($(this).val());

                let newValue = undefined;
                if (value !== FC.SENSOR_ALIGNMENT.align_acc) {
                    newValue = $(this).find('option:selected').text();
                }
                self.analyticsChanges['AccAlignment'] = newValue;

                FC.SENSOR_ALIGNMENT.align_acc = value;
            });

            orientation_mag_e.change(function () {
                let value = parseInt($(this).val());

                let newValue = undefined;
                if (value !== FC.SENSOR_ALIGNMENT.align_mag) {
                    newValue = $(this).find('option:selected').text();
                }
                self.analyticsChanges['MagAlignment'] = newValue;

                FC.SENSOR_ALIGNMENT.align_mag = value;
            });

            // Multi gyro config
            if (semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_41)) {

                gyro_align_content_e.show();
                legacy_gyro_alignment_e.hide();
                legacy_accel_alignment_e.hide();

                const GYRO_DETECTION_FLAGS = {
                        DETECTED_GYRO_1:      (1 << 0),
                        DETECTED_GYRO_2:      (1 << 1),
                        DETECTED_DUAL_GYROS:  (1 << 7),
                };

                const detected_gyro_1 = (FC.SENSOR_ALIGNMENT.gyro_detection_flags & GYRO_DETECTION_FLAGS.DETECTED_GYRO_1) != 0;
                const detected_gyro_2 = (FC.SENSOR_ALIGNMENT.gyro_detection_flags & GYRO_DETECTION_FLAGS.DETECTED_GYRO_2) != 0;
                const detected_dual_gyros = (FC.SENSOR_ALIGNMENT.gyro_detection_flags & GYRO_DETECTION_FLAGS.DETECTED_DUAL_GYROS) != 0;

                if (detected_gyro_1) {
                    orientation_gyro_to_use_e.append(`<option value="0">${i18n.getMessage('configurationSensorGyroToUseFirst')}</option>`);
                }
                if (detected_gyro_2) {
                    orientation_gyro_to_use_e.append(`<option value="1">${i18n.getMessage('configurationSensorGyroToUseSecond')}</option>`);
                }
                if (detected_dual_gyros) {
                    orientation_gyro_to_use_e.append(`<option value="2">${i18n.getMessage('configurationSensorGyroToUseBoth')}</option>`);
                }

                for (let i = 0; i < alignments.length; i++) {
                    orientation_gyro_1_align_e.append(`<option value="${(i+1)}">${alignments[i]}</option>`);
                    orientation_gyro_2_align_e.append(`<option value="${(i+1)}">${alignments[i]}</option>`);
                }

                orientation_gyro_to_use_e.val(FC.SENSOR_ALIGNMENT.gyro_to_use);
                orientation_gyro_1_align_e.val(FC.SENSOR_ALIGNMENT.gyro_1_align);
                orientation_gyro_2_align_e.val(FC.SENSOR_ALIGNMENT.gyro_2_align);

                $('.gyro_alignment_inputs_first').toggle(detected_gyro_1);
                $('.gyro_alignment_inputs_second').toggle(detected_gyro_2);
                $('.gyro_alignment_inputs_selection').toggle(detected_gyro_1 || detected_gyro_2);
                $('.gyro_alignment_inputs_notfound').toggle(!detected_gyro_1 && !detected_gyro_2);

                orientation_gyro_1_align_e.change(function () {
                    let value = parseInt($(this).val());

                    let newValue = undefined;
                    if (value !== FC.SENSOR_ALIGNMENT.gyro_1_align) {
                        newValue = $(this).find('option:selected').text();
                    }
                    self.analyticsChanges['Gyro1Alignment'] = newValue;

                    FC.SENSOR_ALIGNMENT.gyro_1_align = value;
                });

                orientation_gyro_2_align_e.change(function () {
                    let value = parseInt($(this).val());

                    let newValue = undefined;
                    if (value !== FC.SENSOR_ALIGNMENT.gyro_2_align) {
                        newValue = $(this).find('option:selected').text();
                    }
                    self.analyticsChanges['Gyro2Alignment'] = newValue;

                    FC.SENSOR_ALIGNMENT.gyro_2_align = value;
                });
            }
        }

        // Gyro and PID update
        const gyroUse32kHzElement = $('input[id="gyroUse32kHz"]');
        const gyroTextElement = $('input.gyroFrequency');
        const gyroSelectElement = $('select.gyroSyncDenom');
        const pidSelectElement = $('select.pidProcessDenom');

        function addDenomOption(element, denom, baseFreq) {
            let denomDescription;
            if (baseFreq === 0) {
                denomDescription = i18n.getMessage('configurationSpeedPidNoGyro', {'value' : denom});
            } else {
                denomDescription = i18n.getMessage('configurationKHzUnitLabel', { 'value' : (baseFreq / denom).toFixed(2)});
            }
            element.append(`<option value="${denom}">${denomDescription}</option>`);
        }

        const updateGyroDenom = function (gyroBaseFreq) {

            gyroTextElement.hide();

            const originalGyroDenom = gyroSelectElement.val();

            gyroSelectElement.empty();

            const MAX_DENOM = semver.gte(FC.CONFIG.apiVersion, "1.25.0") && semver.lt(FC.CONFIG.apiVersion, API_VERSION_1_41) ? 32 : 8;

            for (let denom = 1; denom <= MAX_DENOM; denom++) {
                addDenomOption(gyroSelectElement, denom, gyroBaseFreq);
            }

            gyroSelectElement.val(originalGyroDenom);

            gyroSelectElement.change();
         };

         const updateGyroDenomReadOnly = function (gyroFrequency) {
             gyroSelectElement.hide();

             let gyroContent;
             if (gyroFrequency === 0) {
                gyroContent = i18n.getMessage('configurationSpeedGyroNoGyro');
             } else {
                gyroContent = i18n.getMessage('configurationKHzUnitLabel', { 'value' : (gyroFrequency / 1000).toFixed(2)});
             }
             gyroTextElement.val(gyroContent);
         };

         if (semver.gte(FC.CONFIG.apiVersion, "1.25.0") && semver.lt(FC.CONFIG.apiVersion, API_VERSION_1_41)) {
             gyroUse32kHzElement.prop('checked', FC.ADVANCED_CONFIG.gyroUse32kHz !== 0);

             gyroUse32kHzElement.change(function () {
                 const gyroBaseFreq = ($(this).is(':checked'))? 32 : 8;

                 updateGyroDenom(gyroBaseFreq);
             }).change();

         } else {

             $('div.gyroUse32kHz').hide();

             if (semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_43)) {
                 updateGyroDenomReadOnly(FC.CONFIG.sampleRateHz);
             } else {
                 updateGyroDenom(8);
             }
        }

        gyroSelectElement.val(FC.ADVANCED_CONFIG.gyro_sync_denom);

        $('.systemconfigNote').html(i18n.getMessage('configurationLoopTimeHelp'));

        gyroSelectElement.change(function () {
            const originalPidDenom = parseInt(pidSelectElement.val());

            let pidBaseFreq;
            if (semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_43)) {
                pidBaseFreq = FC.CONFIG.sampleRateHz / 1000;
            } else {
                pidBaseFreq = 8;
                if (semver.gte(FC.CONFIG.apiVersion, "1.25.0") && semver.lt(FC.CONFIG.apiVersion, API_VERSION_1_41) && gyroUse32kHzElement.is(':checked')) {
                    pidBaseFreq = 32;
                }
                pidBaseFreq = pidBaseFreq / parseInt($(this).val());
            }

            pidSelectElement.empty();

            const MAX_DENOM = semver.gte(FC.CONFIG.apiVersion, "1.24.0") ? 16 : 8;

            for (let denom = 1; denom <= MAX_DENOM; denom++) {
                addDenomOption(pidSelectElement, denom, pidBaseFreq);
            }

            pidSelectElement.val(originalPidDenom);
        }).change();

        pidSelectElement.val(FC.ADVANCED_CONFIG.pid_process_denom);

        $('input[id="accHardwareSwitch"]').prop('checked', FC.SENSOR_CONFIG.acc_hardware !== 1);
        $('input[id="baroHardwareSwitch"]').prop('checked', FC.SENSOR_CONFIG.baro_hardware !== 1);
        $('input[id="magHardwareSwitch"]').prop('checked', FC.SENSOR_CONFIG.mag_hardware !== 1);

        // Only show these sections for supported FW
        if (semver.lt(FC.CONFIG.apiVersion, "1.16.0")) {
            $('.selectPidProcessDenom').hide();
        }

        if (semver.lt(FC.CONFIG.apiVersion, "1.16.0")) {
            $('.hardwareSelection').hide();
        }

        $('input[name="craftName"]').val(FC.CONFIG.name);

        if (semver.lt(FC.CONFIG.apiVersion, "1.20.0")) {
            $('.miscSettings').hide();
        }

        // fill board alignment
        $('input[name="board_align_roll"]').val(FC.BOARD_ALIGNMENT_CONFIG.roll);
        $('input[name="board_align_pitch"]').val(FC.BOARD_ALIGNMENT_CONFIG.pitch);
        $('input[name="board_align_yaw"]').val(FC.BOARD_ALIGNMENT_CONFIG.yaw);

        // fill accel trims
        $('input[name="roll"]').val(FC.CONFIG.accelerometerTrims[1]);
        $('input[name="pitch"]').val(FC.CONFIG.accelerometerTrims[0]);

        // UI hooks

        $('input.feature', features_e).change(function () {
            const element = $(this);
            FC.FEATURE_CONFIG.features.updateData(element);
            updateTabList(FC.FEATURE_CONFIG.features);
        });

        $('input[id="accHardwareSwitch"]').change(function() {
            if(semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_37)) {
              const checked = $(this).is(':checked');
              $('.accelNeeded').toggle(checked);
            }
        }).change();

        $(features_e).filter('select').change(function () {
            const element = $(this);

            FC.FEATURE_CONFIG.features.updateData(element);
            updateTabList(FC.FEATURE_CONFIG.features);
        });


        $('.content_wrapper').change(function () {
            showToolbar();
        });

        $('a.revert').click(function () {
            self.refresh();
        });

        $('a.save').on('click', function() {
            // gather data that doesn't have automatic change event bound
            FC.BOARD_ALIGNMENT_CONFIG.roll = parseInt($('input[name="board_align_roll"]').val());
            FC.BOARD_ALIGNMENT_CONFIG.pitch = parseInt($('input[name="board_align_pitch"]').val());
            FC.BOARD_ALIGNMENT_CONFIG.yaw = parseInt($('input[name="board_align_yaw"]').val());

            FC.CONFIG.accelerometerTrims[1] = parseInt($('input[name="roll"]').val());
            FC.CONFIG.accelerometerTrims[0] = parseInt($('input[name="pitch"]').val());

            if (semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_41)) {
                FC.SENSOR_ALIGNMENT.gyro_to_use = parseInt(orientation_gyro_to_use_e.val());
            }

            FC.ADVANCED_CONFIG.gyro_sync_denom = parseInt(gyroSelectElement.val());

            const value = parseInt(pidSelectElement.val());

            if (value !== FC.ADVANCED_CONFIG.pid_process_denom) {
                const newFrequency = pidSelectElement.find('option:selected').text();
                self.analyticsChanges['PIDLoopSettings'] = `denominator: ${value} | frequency: ${newFrequency}`;
            } else {
                self.analyticsChanges['PIDLoopSettings'] = undefined;
            }

            FC.ADVANCED_CONFIG.pid_process_denom = value;
            if (semver.gte(FC.CONFIG.apiVersion, "1.25.0") && semver.lt(FC.CONFIG.apiVersion, API_VERSION_1_41)) {
                FC.ADVANCED_CONFIG.gyroUse32kHz = $('input[id="gyroUse32kHz"]').is(':checked') ? 1 : 0;
            }

            analytics.sendChangeEvents(analytics.EVENT_CATEGORIES.FLIGHT_CONTROLLER, self.analyticsChanges);
            self.analyticsChanges = {};

            // fill some data
            if (semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_34)) {
                FC.GPS_CONFIG.auto_baud = $('input[name="gps_auto_baud"]').is(':checked') ? 1 : 0;
                FC.GPS_CONFIG.auto_config = $('input[name="gps_auto_config"]').is(':checked') ? 1 : 0;
            }

            FC.SENSOR_CONFIG.acc_hardware = $('input[id="accHardwareSwitch"]').is(':checked') ? 0 : 1;
            FC.SENSOR_CONFIG.baro_hardware = $('input[id="baroHardwareSwitch"]').is(':checked') ? 0 : 1;
            FC.SENSOR_CONFIG.mag_hardware = $('input[id="magHardwareSwitch"]').is(':checked') ? 0 : 1;
            FC.CONFIG.name = $.trim($('input[name="craftName"]').val());

            function save_serial_config() {
                mspHelper.sendSerialConfig(save_config);
            }

            function save_config() {
                Promise
                .resolve(true)
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_FEATURE_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FEATURE_CONFIG)); })
                .then(() => { return (semver.lt(FC.CONFIG.apiVersion, API_VERSION_1_33)) ?
                    MSP.promise(MSPCodes.MSP_SET_MISC, mspHelper.crunch(MSPCodes.MSP_SET_MISC)) : true; })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_BOARD_ALIGNMENT_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_BOARD_ALIGNMENT_CONFIG)); })
                .then(() => { return (semver.gte(FC.CONFIG.apiVersion, API_VERSION_1_33)) ?
                    MSP.promise(MSPCodes.MSP_SET_GPS_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_GPS_CONFIG)) : true; })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_RC_DEADBAND, mspHelper.crunch(MSPCodes.MSP_SET_RC_DEADBAND)); })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_SENSOR_ALIGNMENT, mspHelper.crunch(MSPCodes.MSP_SET_SENSOR_ALIGNMENT)); })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_ADVANCED_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ADVANCED_CONFIG)); })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_ACC_TRIM, mspHelper.crunch(MSPCodes.MSP_SET_ACC_TRIM)); })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_ARMING_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ARMING_CONFIG)); })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_SENSOR_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_SENSOR_CONFIG)); })
                .then(() => { return MSP.promise(MSPCodes.MSP_SET_NAME, mspHelper.crunch(MSPCodes.MSP_SET_NAME)); })
                .then(() => { return (semver.gte(FC.CONFIG.apiVersion, "1.20.0")) ? MSP.promise(MSPCodes.MSP_SET_RX_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_RX_CONFIG)) : true; })
                .then(() => { return MSP.promise(MSPCodes.MSP_EEPROM_WRITE); })
                .then(() => { reboot(); });
            }

            function reboot() {
                GUI.log(i18n.getMessage('eepromSaved'));

                GUI.tab_switch_cleanup(function() {
                    MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false);
                    reinitialiseConnection(self);
                });
            }

            save_serial_config();
        });

        // status data pulled via separate timer with static speed
        GUI.interval_add('status_pull', function() {
            MSP.send_message(MSPCodes.MSP_STATUS);
        }, 250, true);
        GUI.content_ready(callback);
    }
};

TABS.configuration.cleanup = function (callback) {
    if (callback) callback();
};

TABS.configuration.refresh = function (callback) {
    const self = this;

    GUI.tab_switch_cleanup(function () {
        self.initialize();
        if (callback) callback();
    });
};

