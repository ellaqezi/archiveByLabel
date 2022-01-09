function testArchiveDirectory() {
    var label = "foo/bar/bao/for"
    try {
        archiveDirectory(label);
    } catch (e) {
        Logger.log(e)
    }
}
