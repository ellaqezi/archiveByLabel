const REQUIRED_FIELDS = ['label', 'query', 'user_id']

function createFormSection(input = DEFAULTS) {
    var labelInput = CardService.newTextInput().setFieldName(REQUIRED_FIELDS[0])
        .setTitle('Label').setHint("Drive directory to save files to");
    var queryInput = CardService.newTextInput().setFieldName(REQUIRED_FIELDS[1])
        .setTitle('Query').setHint('Gmail search operators, see https://support.google.com/mail/answer/7190?hl=en');
    var userInput = CardService.newTextInput().setFieldName(REQUIRED_FIELDS[2])
        .setTitle('User ID').setHint("Gmail account");
    var tzInput = CardService.newTextInput().setFieldName('tz').setTitle('Timezone').setHint("Used in naming archived attachments");
    var switchAction = CardService.newSwitch()
        .setFieldName("standardize").setValue("true").setOnChangeAction(CardService.newAction().setFunctionName("handleSwitchChange"));
    try {
        labelInput.setValue(input.label);
        queryInput.setValue(input.query);
        userInput.setValue(input.user_id);
        switchAction.setSelected(input.standardize === 'true');
        tzInput.setValue(input.tz);
    } catch (e) {
        Logger.log(e)
        tzInput.setValue(DEFAULTS.tz);
    }
    var switchDecoratedText = CardService.newDecoratedText().setTopLabel("Add timestamp?").setText("Adds message timestamp to filename.").setWrapText(true).setSwitchControl(switchAction);
    return [labelInput, queryInput, userInput, switchDecoratedText, tzInput];
}

function createCard(input = createFormSection()) {
    var inputForm = CardService.newCardSection();
    input.forEach(function (w) {
        inputForm.addWidget(w);
    });
    var footer = CardService.newFixedFooter().setPrimaryButton(CardService.newTextButton().setText('Save attachments').setOnClickAction(CardService.newAction().setFunctionName('submitForm')));
    return CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle('Archive Gmail Attachments to Drive'))
        .setFixedFooter(footer).addSection(inputForm.addWidget(relatedLinks({
            "#label": "https://support.google.com/drive/answer/2375091",
            "#query": "https://support.google.com/mail/answer/7190"
        })));
}

function onDefaultHomePageOpen() {
    return [createCard().build()];
}

function submitForm(event) {
    try {
        REQUIRED_FIELDS.forEach(function (fieldName) {
            if (!event.formInput[fieldName]) {
                throw "Please set: " + fieldName
            }
        });
        event = archiveByLabel(event.formInput);
    } catch (error) {
        event = error;
    }
    return CardService.newActionResponseBuilder().setNotification(CardService.newNotification().setText(event)).build();
}

function handleSwitchChange(event) {
    var form = createFormSection(event.formInput)
    if (!event.formInput.standardize) {
        form.pop(); // hide tzInput when switched off
    }
    Logger.log(form);
    return [createCard(form).build()];
}

function relatedLinks(dict) {
    var buttonSet = CardService.newButtonSet();
    for (const [key, value] of Object.entries(dict)) {
        buttonSet.addButton(CardService.newTextButton().setText(key).setOpenLink(
            CardService.newOpenLink().setUrl(value)));
    }
    return buttonSet;
}