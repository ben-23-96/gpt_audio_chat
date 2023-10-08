const { execSync } = require('child_process');
const path = require('path');
const { existsSync, readdir } = require('fs')
const { dialog } = require('electron');

/**
 * class for checking if SoX exectable is available, if is not avaible can check for binaries in the project and add location to PATH
 */
class BinPath {
    constructor() {
        this.executableName = "sox"
    }

    checkExecutableOnPath() {
        // if SoX available do nothing add bin folder to PATH if bin exists
        if (this.isExecutableOnPath()) {
            console.log(`${this.executableName} is already on the PATH.`);
        } else {
            console.log(`${this.executableName} is not on the PATH.`);
            this.addToPath()
        }
    }

    isExecutableOnPath() {
        try {
            // Try to find the executable
            execSync(`where ${this.executableName}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    addToPath() {
        try {
            //path to binnaries folder
            let binPath;
            // Get the parent directory of __dirname
            const parentDirectory = path.dirname(__dirname);
            // Get the name of the folder before the last folder in the path
            const secondToLastFolderName = path.basename(parentDirectory);
            // if folder is app.asar in packaged version else local, set path accordingly
            if (secondToLastFolderName === 'app.asar') {
                binPath = path.join(__dirname, '..', '..', 'bin')
            }
            else {
                binPath = path.join(__dirname, '..', 'bin')
            }
            console.log(binPath)
            // if bin folder exists append it to PATH env variable
            if (existsSync(binPath)) {
                process.env.PATH += `;${binPath}`
                console.log('sox is now available on PATH.');
            } else {
                throw new Error('The "bin" folder does not exist.');
            }
        } catch (error) {
            // if error finding binaries prompt user to install
            console.error('Error adding sox to PATH:', error.message);
            dialog.showMessageBox({
                type: 'info',
                title: 'Prompt',
                message: 'The project needs sox installed to work, on windows: choco install sox.portable in cmd.',
                buttons: ['OK'],
            });
        }
    }
}

module.exports = BinPath
