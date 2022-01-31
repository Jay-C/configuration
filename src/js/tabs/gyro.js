'use strict';

TABS.gyro = {
    isDirty: false,
    FILTER_TYPE_NAMES: [
        "PT1",
        "BIQUAD",
    ],
    RPM_FILTER_TYPES: [
        'NONE',
        'SINGLE',
        'DOUBLE',
    ],
};

TABS.gyro.initialize = function (callback) {
    const self = this;

    const FILTER_DEFAULT = FC.getFilterDefaults();

    load_data(load_html);

    function load_html() {
        $('#content').load("./tabs/gyro.html", process_html);
    }

    function load_data(callback) {
        MSP.promise(MSPCodes.MSP_STATUS)
            .then(() => MSP.promise(MSPCodes.MSP_FEATURE_CONFIG))
            .then(() => MSP.promise(MSPCodes.MSP_FILTER_CONFIG))
            .then(() => MSP.promise(MSPCodes.MSP_MOTOR_CONFIG))
            .then(() => MSP.promise(MSPCodes.MSP_RPM_FILTER))
            .then(callback);
    }

    function save_data(callback) {
        Promise.resolve(true)
            .then(() => MSP.promise(MSPCodes.MSP_SET_FILTER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FILTER_CONFIG)))
            .then(() => MSP.promise(MSPCodes.MSP_EEPROM_WRITE))
            .then(() => {
                GUI.log(i18n.getMessage('eepromSaved'));
                MSP.send_message(MSPCodes.MSP_SET_REBOOT);
                GUI.log(i18n.getMessage('deviceRebooting'));
                reinitialiseConnection(callback);
            });
    };

    function data_to_form() {

        function populateSelector(name, values) {
            $('select.' + name).each(function () {
                const select = $(this);
                values.forEach(function(value, key) {
                    select.append('<option value="' + key + '">' + value + '</option>');
                });
            });
        }

        populateSelector('lowpassTypes', self.FILTER_TYPE_NAMES);

        $('.gyro_filter select[name="gyroLowpassType"]').val(FC.FILTER_CONFIG.gyro_lowpass_type);
        $('.gyro_filter input[name="gyroLowpassFrequency"]').val(FC.FILTER_CONFIG.gyro_lowpass_hz);
        $('.gyro_filter input[name="gyroLowpassDynMinFrequency"]').val(FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz);
        $('.gyro_filter input[name="gyroLowpassDynMaxFrequency"]').val(FC.FILTER_CONFIG.gyro_lowpass_dyn_max_hz);

        $('.gyro_filter select[name="gyroLowpass2Type"]').val(FC.FILTER_CONFIG.gyro_lowpass2_type);
        $('.gyro_filter input[name="gyroLowpass2Frequency"]').val(FC.FILTER_CONFIG.gyro_lowpass2_hz);

        $('.gyro_filter input[name="gyroNotch1Frequency"]').val(FC.FILTER_CONFIG.gyro_notch_hz);
        $('.gyro_filter input[name="gyroNotch1Cutoff"]').val(FC.FILTER_CONFIG.gyro_notch_cutoff);
        $('.gyro_filter input[name="gyroNotch2Frequency"]').val(FC.FILTER_CONFIG.gyro_notch2_hz);
        $('.gyro_filter input[name="gyroNotch2Cutoff"]').val(FC.FILTER_CONFIG.gyro_notch2_cutoff);

        $('.gyro_filter select[name="dtermLowpassType"]').val(FC.FILTER_CONFIG.dterm_lowpass_type);
        $('.gyro_filter input[name="dtermLowpassFrequency"]').val(FC.FILTER_CONFIG.dterm_lowpass_hz);
        $('.gyro_filter input[name="dtermLowpassDynMinFrequency"]').val(FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz);
        $('.gyro_filter input[name="dtermLowpassDynMaxFrequency"]').val(FC.FILTER_CONFIG.dterm_lowpass_dyn_max_hz);

        $('.gyro_filter select[name="dtermLowpass2Type"]').val(FC.FILTER_CONFIG.dterm_lowpass2_type);
        $('.gyro_filter input[name="dtermLowpass2Frequency"]').val(FC.FILTER_CONFIG.dterm_lowpass2_hz);

        $('.gyro_filter input[name="dTermNotchFrequency"]').val(FC.FILTER_CONFIG.dterm_notch_hz);
        $('.gyro_filter input[name="dTermNotchCutoff"]').val(FC.FILTER_CONFIG.dterm_notch_cutoff);

        $('.gyro_filter input[name="dynamicNotchWidthPercent"]').val(FC.FILTER_CONFIG.dyn_notch_width_percent);
        $('.gyro_filter input[name="dynamicNotchQ"]').val(FC.FILTER_CONFIG.dyn_notch_q);
        $('.gyro_filter input[name="dynamicNotchMinHz"]').val(FC.FILTER_CONFIG.dyn_notch_min_hz);
        $('.gyro_filter input[name="dynamicNotchMaxHz"]').val(FC.FILTER_CONFIG.dyn_notch_max_hz);

        if (FC.FEATURE_CONFIG.features.isEnabled('DYNAMIC_FILTER')) {
            $('.gyro_filter .dynamicNotch').show();
        } else {
            $('.gyro_filter .dynamicNotch').hide();
        }

        $('input[id="gyroLowpassEnabled"]').change(function() {
            const checked = $(this).is(':checked');
            let type = 0, freq = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.gyro_lowpass_hz > 0) {
                    type = FC.FILTER_CONFIG.gyro_lowpass_type;
                    freq = FC.FILTER_CONFIG.gyro_lowpass_hz;
                } else {
                    type = FILTER_DEFAULT.gyro_lowpass_type;
                    freq = FILTER_DEFAULT.gyro_lowpass_hz;
                }
            }

            $('.gyro_filter select[name="gyroLowpassType"]').val(type).attr('disabled', !checked);
            $('.gyro_filter input[name="gyroLowpassFrequency"]').val(freq).attr('disabled', !checked);

            if (!checked) {
                $('input[id="gyroLowpassDynEnabled"]').prop('checked', false).change();
            }
        });

        $('input[id="gyroLowpassDynEnabled"]').change(function() {
            const checked = $(this).is(':checked');
            let minf = 0, maxf = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz > 0 &&
                    FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz < FC.FILTER_CONFIG.gyro_lowpass_dyn_max_hz) {
                    minf = FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz;
                    maxf = FC.FILTER_CONFIG.gyro_lowpass_dyn_max_hz;
                } else {
                    minf = FILTER_DEFAULT.gyro_lowpass_dyn_min_hz;
                    maxf = FILTER_DEFAULT.gyro_lowpass_dyn_max_hz;
                }
            }

            $('.gyro_filter input[name="gyroLowpassDynMinFrequency"]').val(minf).attr('disabled', !checked);
            $('.gyro_filter input[name="gyroLowpassDynMaxFrequency"]').val(maxf).attr('disabled', !checked);
        });

        $('input[id="gyroLowpass2Enabled"]').change(function() {
            const checked = $(this).is(':checked');
            let type = 0, freq = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.gyro_lowpass2_hz > 0) {
                    type = FC.FILTER_CONFIG.gyro_lowpass2_type;
                    freq = FC.FILTER_CONFIG.gyro_lowpass2_hz;
                } else {
                    type = FILTER_DEFAULT.gyro_lowpass2_type;
                    freq = FILTER_DEFAULT.gyro_lowpass2_hz;
                }
            }

            $('.gyro_filter select[name="gyroLowpass2Type"]').val(type).attr('disabled', !checked);
            $('.gyro_filter input[name="gyroLowpass2Frequency"]').val(freq).attr('disabled', !checked);
        });

        $('input[id="gyroNotch1Enabled"]').change(function() {
            const checked = $(this).is(':checked');
            let freq = 0, cutf = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.gyro_notch_hz > 0) {
                    freq = FC.FILTER_CONFIG.gyro_notch_hz;
                    cutf = FC.FILTER_CONFIG.gyro_notch_cutoff;
                } else {
                    freq = FILTER_DEFAULT.gyro_notch_hz;
                    cutf = FILTER_DEFAULT.gyro_notch_cutoff;
                }
            }

            $('.gyro_filter input[name="gyroNotch1Frequency"]').val(freq).attr('disabled', !checked).change();
            $('.gyro_filter input[name="gyroNotch1Cutoff"]').val(cutf).attr('disabled', !checked).change();
        });

        $('input[id="gyroNotch2Enabled"]').change(function() {
            const checked = $(this).is(':checked');
            let freq = 0, cutf = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.gyro_notch2_hz > 0) {
                    freq = FC.FILTER_CONFIG.gyro_notch2_hz;
                    cutf = FC.FILTER_CONFIG.gyro_notch2_cutoff;
                } else {
                    freq = FILTER_DEFAULT.gyro_notch2_hz;
                    cutf = FILTER_DEFAULT.gyro_notch2_cutoff;
                }
            }

            $('.gyro_filter input[name="gyroNotch2Frequency"]').val(freq).attr('disabled', !checked).change();
            $('.gyro_filter input[name="gyroNotch2Cutoff"]').val(cutf).attr('disabled', !checked).change();
        });

        $('input[id="dtermLowpassEnabled"]').change(function() {
            const checked = $(this).is(':checked');
            let type = 0, freq = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.dterm_lowpass_hz > 0) {
                    type = FC.FILTER_CONFIG.dterm_lowpass_type;
                    freq = FC.FILTER_CONFIG.dterm_lowpass_hz;
                } else {
                    type = FILTER_DEFAULT.dterm_lowpass_type;
                    freq = FILTER_DEFAULT.dterm_lowpass_hz;
                }
            }

            $('.gyro_filter select[name="dtermLowpassType"]').val(type).attr('disabled', !checked);
            $('.gyro_filter input[name="dtermLowpassFrequency"]').val(freq).attr('disabled', !checked);

            if (!checked) {
                $('input[id="dtermLowpassDynEnabled"]').prop('checked', false).change();
            }
        });

        $('input[id="dtermLowpassDynEnabled"]').change(function() {
            const checked = $(this).is(':checked');
            let minf = 0, maxf = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz > 0 &&
                    FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz < FC.FILTER_CONFIG.dterm_lowpass_dyn_max_hz) {
                    minf = FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz;
                    maxf = FC.FILTER_CONFIG.dterm_lowpass_dyn_max_hz;
                } else {
                    minf = FILTER_DEFAULT.dterm_lowpass_dyn_min_hz;
                    maxf = FILTER_DEFAULT.dterm_lowpass_dyn_max_hz;
                }
            }

            $('.gyro_filter input[name="dtermLowpassDynMinFrequency"]').val(minf).attr('disabled', !checked);
            $('.gyro_filter input[name="dtermLowpassDynMaxFrequency"]').val(maxf).attr('disabled', !checked);
        });

        $('input[id="dtermLowpass2Enabled"]').change(function() {
            const checked = $(this).is(':checked');
            let type = 0, freq = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.dterm_lowpass2_hz > 0) {
                    type = FC.FILTER_CONFIG.dterm_lowpass2_type;
                    freq = FC.FILTER_CONFIG.dterm_lowpass2_hz;
                } else {
                    type = FILTER_DEFAULT.dterm_lowpass2_type;
                    freq = FILTER_DEFAULT.dterm_lowpass2_hz;
                }
            }

            $('.gyro_filter select[name="dtermLowpass2Type"]').val(type).attr('disabled', !checked);
            $('.gyro_filter input[name="dtermLowpass2Frequency"]').val(freq).attr('disabled', !checked);
        });

        $('input[id="dtermNotchEnabled"]').change(function() {
            const checked = $(this).is(':checked');
            let freq = 0, cutf = 0;

            if (checked) {
                if (FC.FILTER_CONFIG.dterm_notch_hz > 0 && FC.FILTER_CONFIG.dterm_notch_cutoff > 0) {
                    freq = FC.FILTER_CONFIG.dterm_notch_hz;
                    cutf = FC.FILTER_CONFIG.dterm_notch_cutoff;
                } else {
                    freq = FILTER_DEFAULT.dterm_notch_hz;
                    cutf = FILTER_DEFAULT.dterm_notch_cutoff;
                }
            }

            $('.gyro_filter input[name="dTermNotchFrequency"]').val(freq);
            $('.gyro_filter input[name="dTermNotchFrequency"]').attr('disabled', !checked).change();
            $('.gyro_filter input[name="dTermNotchCutoff"]').val(cutf);
            $('.gyro_filter input[name="dTermNotchCutoff"]').attr('disabled', !checked).change();
        });

        // The notch cutoff must be smaller than the notch frequency
        function adjustGyroNotch(fName) {
            const freq = parseInt($(`.gyro_filter input[name='${fName}Frequency']`).val());
            const cutf = parseInt($(`.gyro_filter input[name='${fName}Cutoff']`).val());
            const maxf = (freq > 0) ? freq - 1 : 0;
            if (cutf >= freq)
                $(`.gyro_filter input[name='${fName}Cutoff']`).val(maxf);
            $(`.gyro_filter input[name='${fName}Cutoff']`).attr("max", maxf);
        }

        $('input[name="gyroNotch1Frequency"]').change(function() {
            adjustGyroNotch("gyroNotch1");
        }).change();

        $('input[name="gyroNotch2Frequency"]').change(function() {
            adjustGyroNotch("gyroNotch2");
        }).change();

        $('input[name="dTermNotchFrequency"]').change(function() {
            adjustGyroNotch("dTermNotch");
        }).change();

        $('input[id="gyroLowpassEnabled"]').prop('checked', FC.FILTER_CONFIG.gyro_lowpass_hz != 0).change();
        $('input[id="gyroLowpassDynEnabled"]').prop('checked', FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz > 0 &&
                                                    FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz < FC.FILTER_CONFIG.gyro_lowpass_dyn_max_hz).change();

        $('input[id="gyroLowpass2Enabled"]').prop('checked', FC.FILTER_CONFIG.gyro_lowpass2_hz != 0).change();

        $('input[id="gyroNotch1Enabled"]').prop('checked', FC.FILTER_CONFIG.gyro_notch_hz != 0).change();
        $('input[id="gyroNotch2Enabled"]').prop('checked', FC.FILTER_CONFIG.gyro_notch2_hz != 0).change();

        $('input[id="dtermLowpassEnabled"]').prop('checked', FC.FILTER_CONFIG.dterm_lowpass_hz != 0).change();
        $('input[id="dtermLowpassDynEnabled"]').prop('checked', FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz > 0 &&
                                                     FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz < FC.FILTER_CONFIG.dterm_lowpass_dyn_max_hz).change();

        $('input[id="dtermLowpass2Enabled"]').prop('checked', FC.FILTER_CONFIG.dterm_lowpass2_hz != 0).change();

        $('input[id="dtermNotchEnabled"]').prop('checked', FC.FILTER_CONFIG.dterm_notch_hz != 0).change();

        populateSelector('rpmFilterTypes', self.RPM_FILTER_TYPES);

        $('input[id="gyroRpmFilterMainRotorSw1"]').prop('checked', self.rpmFilter.mainRotor[0].count > 0).change();
        $('input[id="gyroRpmFilterMainRotorSw2"]').prop('checked', self.rpmFilter.mainRotor[1].count > 0).change();
        $('input[id="gyroRpmFilterMainRotorSw3"]').prop('checked', self.rpmFilter.mainRotor[2].count > 0).change();
        $('input[id="gyroRpmFilterMainRotorSw4"]').prop('checked', self.rpmFilter.mainRotor[3].count > 0).change();

        $('input[id="gyroRpmFilterMainRotorQ1"]').val(self.rpmFilter.mainRotor[0].notch_q / 100).change();
        $('input[id="gyroRpmFilterMainRotorQ2"]').val(self.rpmFilter.mainRotor[1].notch_q / 100).change();
        $('input[id="gyroRpmFilterMainRotorQ3"]').val(self.rpmFilter.mainRotor[2].notch_q / 100).change();
        $('input[id="gyroRpmFilterMainRotorQ4"]').val(self.rpmFilter.mainRotor[3].notch_q / 100).change();

        $('select[id="gyroRpmFilterMainRotorNotch1"]').val(self.rpmFilter.mainRotor[0].count).change();
        $('select[id="gyroRpmFilterMainRotorNotch2"]').val(self.rpmFilter.mainRotor[1].count).change();

        $('input[id="gyroRpmFilterTailRotorSw1"]').prop('checked', self.rpmFilter.tailRotor[0].count > 0).change();
        $('input[id="gyroRpmFilterTailRotorSw2"]').prop('checked', self.rpmFilter.tailRotor[1].count > 0).change();
        $('input[id="gyroRpmFilterTailRotorSw3"]').prop('checked', self.rpmFilter.tailRotor[2].count > 0).change();
        $('input[id="gyroRpmFilterTailRotorSw4"]').prop('checked', self.rpmFilter.tailRotor[3].count > 0).change();

        $('input[id="gyroRpmFilterTailRotorQ1"]').val(self.rpmFilter.tailRotor[0].notch_q / 100).change();
        $('input[id="gyroRpmFilterTailRotorQ2"]').val(self.rpmFilter.tailRotor[1].notch_q / 100).change();
        $('input[id="gyroRpmFilterTailRotorQ3"]').val(self.rpmFilter.tailRotor[2].notch_q / 100).change();
        $('input[id="gyroRpmFilterTailRotorQ4"]').val(self.rpmFilter.tailRotor[3].notch_q / 100).change();

        $('select[id="gyroRpmFilterTailRotorNotch1"]').val(self.rpmFilter.tailRotor[0].count).change();
        $('select[id="gyroRpmFilterTailRotorNotch2"]').val(self.rpmFilter.tailRotor[1].count).change();

        $('input[id="gyroRpmFilterMainMotorSw1"]').prop('checked', self.rpmFilter.mainMotor[0].count > 0).change();
        $('input[id="gyroRpmFilterMainMotorQ1"]').val(self.rpmFilter.mainMotor[0].notch_q / 100).change();

    }

    function form_to_data() {

        if ($('input[id="gyroLowpassEnabled"]').is(':checked')) {
            FC.FILTER_CONFIG.gyro_lowpass_type = parseInt($('.gyro_filter select[name="gyroLowpassType"]').val());
            FC.FILTER_CONFIG.gyro_lowpass_hz = parseInt($('.gyro_filter input[name="gyroLowpassFrequency"]').val());
        } else {
            FC.FILTER_CONFIG.gyro_lowpass_type = 0;
            FC.FILTER_CONFIG.gyro_lowpass_hz = 0;
        }

        if ($('input[id="gyroLowpassDynEnabled"]').is(':checked')) {
            FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz = parseInt($('.gyro_filter input[name="gyroLowpassDynMinFrequency"]').val());
            FC.FILTER_CONFIG.gyro_lowpass_dyn_max_hz = parseInt($('.gyro_filter input[name="gyroLowpassDynMaxFrequency"]').val());
        } else {
            FC.FILTER_CONFIG.gyro_lowpass_dyn_min_hz = 0;
            FC.FILTER_CONFIG.gyro_lowpass_dyn_max_hz = 0;
        }

        if ($('input[id="gyroLowpass2Enabled"]').is(':checked')) {
            FC.FILTER_CONFIG.gyro_lowpass2_type = parseInt($('.gyro_filter select[name="gyroLowpass2Type"]').val());
            FC.FILTER_CONFIG.gyro_lowpass2_hz = parseInt($('.gyro_filter input[name="gyroLowpass2Frequency"]').val());
        } else {
            FC.FILTER_CONFIG.gyro_lowpass2_type = 0;
            FC.FILTER_CONFIG.gyro_lowpass2_hz = 0;
        }

        if ($('input[id="gyroNotch1Enabled"]').is(':checked')) {
            FC.FILTER_CONFIG.gyro_notch_hz = parseInt($('.gyro_filter input[name="gyroNotch1Frequency"]').val());
            FC.FILTER_CONFIG.gyro_notch_cutoff = parseInt($('.gyro_filter input[name="gyroNotch1Cutoff"]').val());
        } else {
            FC.FILTER_CONFIG.gyro_notch_hz = 0;
            FC.FILTER_CONFIG.gyro_notch_cutoff = 0;
        }

        if ($('input[id="gyroNotch2Enabled"]').is(':checked')) {
            FC.FILTER_CONFIG.gyro_notch2_hz = parseInt($('.gyro_filter input[name="gyroNotch2Frequency"]').val());
            FC.FILTER_CONFIG.gyro_notch2_cutoff = parseInt($('.gyro_filter input[name="gyroNotch2Cutoff"]').val());
        } else {
            FC.FILTER_CONFIG.gyro_notch2_hz = 0;
            FC.FILTER_CONFIG.gyro_notch2_cutoff = 0;
        }

        FC.FILTER_CONFIG.dyn_notch_width_percent = parseInt($('.gyro_filter input[name="dynamicNotchWidthPercent"]').val());
        FC.FILTER_CONFIG.dyn_notch_q = parseInt($('.gyro_filter input[name="dynamicNotchQ"]').val());
        FC.FILTER_CONFIG.dyn_notch_min_hz = parseInt($('.gyro_filter input[name="dynamicNotchMinHz"]').val());
        FC.FILTER_CONFIG.dyn_notch_max_hz = parseInt($('.gyro_filter input[name="dynamicNotchMaxHz"]').val());

        if ($('input[id="dtermLowpassEnabled"]').is(':checked')) {
            FC.FILTER_CONFIG.dterm_lowpass_type = $('.gyro_filter select[name="dtermLowpassType"]').val();
            FC.FILTER_CONFIG.dterm_lowpass_hz = parseInt($('.gyro_filter input[name="dtermLowpassFrequency"]').val());
        } else {
            FC.FILTER_CONFIG.dterm_lowpass_type = 0;
            FC.FILTER_CONFIG.dterm_lowpass_hz = 0;
        }

        if ($('input[id="dtermLowpassDynEnabled"]').is(':checked')) {
            FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz = parseInt($('.gyro_filter input[name="dtermLowpassDynMinFrequency"]').val());
            FC.FILTER_CONFIG.dterm_lowpass_dyn_max_hz = parseInt($('.gyro_filter input[name="dtermLowpassDynMaxFrequency"]').val());
        } else {
            FC.FILTER_CONFIG.dterm_lowpass_dyn_min_hz = 0;
            FC.FILTER_CONFIG.dterm_lowpass_dyn_max_hz = 0;
        }

        if ($('input[id="dtermLowpass2Enabled"]').is(':checked')) {
            FC.FILTER_CONFIG.dterm_lowpass2_type = $('.gyro_filter select[name="dtermLowpass2Type"]').val();
            FC.FILTER_CONFIG.dterm_lowpass2_hz = parseInt($('.gyro_filter input[name="dtermLowpass2Frequency"]').val());
        } else {
            FC.FILTER_CONFIG.dterm_lowpass2_type = 0;
            FC.FILTER_CONFIG.dterm_lowpass2_hz = 0;
        }

        if ($('input[id="dtermNotchEnabled"]').is(':checked')) {
            FC.FILTER_CONFIG.dterm_notch_hz = parseInt($('.gyro_filter input[name="dTermNotchFrequency"]').val());
            FC.FILTER_CONFIG.dterm_notch_cutoff = parseInt($('.gyro_filter input[name="dTermNotchCutoff"]').val());
        } else {
            FC.FILTER_CONFIG.dterm_notch_hz = 0;
            FC.FILTER_CONFIG.dterm_notch_cutoff = 0;
        }
    }

    function process_html() {

        // translate to user-selected language
        i18n.localizePage();

        // Load RPM filter configuration
        RPMFilter.initialize();
        self.rpmFilter = RPMFilter.parseAdvancedConfig(FC.RPM_FILTER_CONFIG);

        // UI Hooks
        data_to_form();

        // Hide the buttons toolbar
        $('.tab-gyro').addClass('toolbar_hidden');

        self.isDirty = false;

        function setDirty() {
            if (!self.isDirty) {
                self.isDirty = true;
                $('.tab-gyro').removeClass('toolbar_hidden');
            }
        }

        $('.gyro_filter').change(function () {
            setDirty();
        });

        self.save = function (callback) {
            form_to_data();
            save_data(callback);
        };

        self.revert = function (callback) {
            callback();
        };

        $('a.save').click(function () {
            self.save(() => GUI.tab_switch_reload());
        });

        $('a.revert').click(function () {
            self.revert(() => GUI.tab_switch_reload());
        });

        GUI.content_ready(callback);
    }
};


TABS.gyro.cleanup = function (callback) {
    this.isDirty = false;

    if (callback) callback();
};
