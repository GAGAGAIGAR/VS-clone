let characterImages = {
    'ANNA': {
        high: null,
        mid: null,
        low: null,
        dead: null,
        background: null
    },
    'TRACY': {
        high: null,
        mid: null,
        low: null,
        dead: null,
        background: null
    },
    'URANUS': {
        high: null,
        mid: null,
        low: null,
        dead: null,
        background: null
    }
};

let portraitBuffer;

function setupPortrait() {
    // Create offscreen buffer for portrait rendering (320x720)
    portraitBuffer = createGraphics(320, 720);
    console.log('Portrait buffer initialized: 320x720');
}

function preload() {
    try {
        // Load character portraits
        characterImages['ANNA'].high = loadImage('assets/images/anna_high.png', 
            () => console.log('ANNA high loaded'), 
            () => console.error('Failed to load ANNA high')
        );
        characterImages['ANNA'].mid = loadImage('assets/images/anna_mid.png', 
            () => console.log('ANNA mid loaded'), 
            () => console.error('Failed to load ANNA mid')
        );
        characterImages['ANNA'].low = loadImage('assets/images/anna_low.png', 
            () => console.log('ANNA low loaded'), 
            () => console.error('Failed to load ANNA low')
        );
        characterImages['ANNA'].dead = loadImage('assets/images/anna_dead.png', 
            () => console.log('ANNA dead loaded'), 
            () => console.error('Failed to load ANNA dead')
        );
        characterImages['ANNA'].background = loadImage('assets/images/anna_background.png', 
            () => console.log('ANNA background loaded'), 
            () => console.error('Failed to load ANNA background')
        );
        characterImages['TRACY'].high = loadImage('assets/images/tracy_high.png', 
            () => console.log('TRACY high loaded'), 
            () => console.error('Failed to load TRACY high')
        );
        characterImages['TRACY'].mid = loadImage('assets/images/tracy_mid.png', 
            () => console.log('TRACY mid loaded'), 
            () => console.error('Failed to load TRACY mid')
        );
        characterImages['TRACY'].low = loadImage('assets/images/tracy_low.png', 
            () => console.log('TRACY low loaded'), 
            () => console.error('Failed to load TRACY low')
        );
        characterImages['TRACY'].dead = loadImage('assets/images/tracy_dead.png', 
            () => console.log('TRACY dead loaded'), 
            () => console.error('Failed to load TRACY dead')
        );
        characterImages['TRACY'].background = loadImage('assets/images/tracy_background.png', 
            () => console.log('TRACY background loaded'), 
            () => console.error('Failed to load TRACY background')
        );
        characterImages['URANUS'].high = loadImage('assets/images/uranus_high.png', 
            () => console.log('URANUS high loaded'), 
            () => console.error('Failed to load URANUS high')
        );
        characterImages['URANUS'].mid = loadImage('assets/images/uranus_mid.png', 
            () => console.log('URANUS mid loaded'), 
            () => console.error('Failed to load URANUS mid')
        );
        characterImages['URANUS'].low = loadImage('assets/images/uranus_low.png', 
            () => console.log('URANUS low loaded'), 
            () => console.error('Failed to load URANUS low')
        );
        characterImages['URANUS'].dead = loadImage('assets/images/uranus_dead.png', 
            () => console.log('URANUS dead loaded'), 
            () => console.error('Failed to load URANUS dead')
        );
        characterImages['URANUS'].background = loadImage('assets/images/uranus_background.png', 
            () => console.log('URANUS background loaded'), 
            () => console.error('Failed to load URANUS background')
        );

        // Load sprite sheets for enemies
        ['A', 'B', 'C', 'D', 'Z', 'Y', 'X'].forEach(type => {
            spriteSheets[`enemy_${type}`] = loadImage(`assets/images/enemy_${type}.png`, 
                img => {
                    frameCounts[`enemy_${type}`] = floor(img.width / 48) || 1;
                    console.log(`Enemy ${type} sprite sheet loaded, frames: ${frameCounts[`enemy_${type}`]}, width: ${img.width}, height: ${img.height}`);
                }, 
                () => {
                    console.error(`Failed to load enemy_${type} sprite sheet. Check file path: assets/images/enemy_${type}.png`);
                    spriteSheets[`enemy_${type}`] = null;
                    frameCounts[`enemy_${type}`] = 1;
                }
            );
        });

        // Load sprite sheets for characters
        ['ANNA', 'TRACY'].forEach(char => {
            spriteSheets[char] = loadImage(`assets/images/${char.toLowerCase()}.png`, 
                img => {
                    frameCounts[char] = floor(img.width / 48) || 1;
                    console.log(`${char} sprite sheet loaded, frames: ${frameCounts[char]}, width: ${img.width}, height: ${img.height}`);
                }, 
                () => console.error(`Failed to load ${char} sprite sheet`)
            );
        });
    } catch (e) {
        console.error('画像の読み込みに失敗しました:', e);
    }
}

function drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats) {
    // Clear the offscreen buffer
    portraitBuffer.background(0);

    // Select character based on game state
    let char = gameState === 'characterSelect' ? previewCharacter : selectedCharacter;
    if (!char || !characterImages[char]) return;

    // Get images
    let bg = characterImages[char].background;
    let portrait;
    let maxHp = playerStats.maxHp || playerStats.hp || 100;
    if (gameState !== 'characterSelect') {
        if (playerStats.hp <= 0) {
            portrait = characterImages[char].dead;
        } else if (playerStats.hp < maxHp * 0.3) {
            portrait = characterImages[char].low;
        } else if (playerStats.hp < maxHp * 0.6) {
            portrait = characterImages[char].mid;
        } else {
            portrait = characterImages[char].high;
        }
    } else {
        portrait = characterImages[char].high;
    }

    // Draw background and portrait to buffer
    if (bg) {
        drawImageClipped(portraitBuffer, bg);
    }
    if (portrait) {
        drawImageClipped(portraitBuffer, portrait);
    }

    // Draw text on buffer
    portraitBuffer.fill(255);
    portraitBuffer.textSize(24);
    portraitBuffer.textAlign(LEFT, TOP);
    portraitBuffer.text(char, 10, 10);
    if (gameState !== 'characterSelect') {
        portraitBuffer.text(`HP: ${Math.floor(playerStats.hp)}/${maxHp}`, 10, 40);
    }

    // Draw buffer to main canvas at (0, 0)
    image(portraitBuffer, 0, 0);
}

function drawImageClipped(ctx, img) {
    if (!img || !img.width || !img.height) return;

    // Calculate scaling to fit 320x720, cropping to 320px width centered
    let imgWidth = img.width;
    let imgHeight = img.height;
    let scale = Math.max(320 / imgWidth, 720 / imgHeight);
    let scaledWidth = imgWidth * scale;
    let scaledHeight = imgHeight * scale;

    // Center the image, crop to 320px width
    let srcX = (imgWidth - 320 / scale) / 2; // Source x to start cropping
    let srcWidth = 320 / scale; // Source width to crop
    let srcY = 0;
    let srcHeight = imgHeight;
    let destX = 0;
    let destY = (720 - scaledHeight) / 2; // Center vertically
    let destWidth = 320;
    let destHeight = scaledHeight;

    // Adjust if image is narrower than 320px
    if (scaledWidth < 320) {
        srcX = 0;
        srcWidth = imgWidth;
        destX = (320 - scaledWidth) / 2;
        destWidth = scaledWidth;
    }

    // Draw cropped image
    ctx.image(img, destX, destY, destWidth, destHeight, srcX, srcY, srcWidth, srcHeight);
}