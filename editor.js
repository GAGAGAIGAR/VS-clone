function initializeEditor(stageId) {
    const config = getStageConfig(stageId);
    if (!config) return;
    editorShapes = config.terrain ? JSON.parse(JSON.stringify(config.terrain)) : [];
    
    selectedCharacter = 'ANNA';
    loadCharacter(selectedCharacter);
    resetGameState();

    const mapSize = config.mapSize;
    player = { 
        pos: createVector(mapSize.width / 2, mapSize.height / 2), 
        vel: createVector(0, 0), 
        lastShot: 0,
        facingDirection: 1
    };
    
    setGameState('mapEditor');
}

function updateEditor() {
    updatePlayerMovement();
}

function drawEditorPlacedShapes() {
    if (!showTerrainEffects && gameState !== 'mapEditor') {
        return;
    }

    // ★★★ ここからが修正箇所です ★★★
    let shapesToDraw;

    // gameStateに応じて、描画するデータのソースを切り替える
    if (gameState === 'mapEditor') {
        // エディターモードでは、現在編集中の 'editorShapes' 配列を使用する
        shapesToDraw = editorShapes;
    } else {
        // ゲームプレイ中では、ステージ設定ファイルから 'terrain' データを取得する
        const config = getStageConfig(currentStage);
        shapesToDraw = config ? config.terrain : [];
    }

    // 描画対象のデータが存在しない場合は、ここで処理を終了
    if (!shapesToDraw || shapesToDraw.length === 0) {
        return;
    }
    // ★★★ 修正ここまで ★★★

    // ループの対象を、上で決定した 'shapesToDraw' に変更
    for (const shape of shapesToDraw) {
        push();
        
        // タイプに応じて色分け
        if (shape.type === 2) {
            fill(0, 150, 255, 120);
            stroke(50, 180, 255);
        } else { // デフォルトは type: 1
            fill(255, 0, 255, 100);
            stroke(255, 0, 255);
        }
        strokeWeight(2);
        
        // 回転処理
        if (shape.rotation) {
            let centerX, centerY;
            if (shape.shape === 'rect') {
                centerX = shape.x + shape.w / 2;
                centerY = shape.y + shape.h / 2;
            } else if (shape.shape === 'triangle') {
                centerX = (shape.x1 + shape.x2 + shape.x3) / 3;
                centerY = (shape.y1 + shape.y2 + shape.y3) / 3;
            } else { // circle, ellipse
                centerX = shape.x;
                centerY = shape.y;
            }
            
            translate(centerX, centerY);
            rotate(shape.rotation);
            translate(-centerX, -centerY);
        }

        switch (shape.shape) {
            case 'rect':
                rect(shape.x, shape.y, shape.w, shape.h);
                break;
            case 'circle':
                ellipse(shape.x, shape.y, shape.r * 2);
                break;
            case 'triangle':
                triangle(shape.x1, shape.y1, shape.x2, shape.y2, shape.x3, shape.y3);
                break;
            case 'ellipse':
                ellipse(shape.x, shape.y, shape.rx * 2, shape.ry * 2);
                break;
        }
        pop();
    }
}

function drawEditorUIAndPreview() {
    drawEditorUI();

    if (editorIsDrawing && editorStartPos && editorEndPos) {
        push();
        resetMatrix();
        scale(globalScale);
        fill(0, 255, 255, 50);
        stroke(0, 255, 255);
        strokeWeight(2);

        const startX = editorStartPos.x;
        const startY = editorStartPos.y;
        const endX = editorEndPos.x;
        const endY = editorEndPos.y;

        switch (editorCurrentShapeType) {
            case 'rect':
                rect(startX, startY, endX - startX, endY - startY);
                break;
            case 'circle':
                const radius = dist(startX, startY, endX, endY);
                ellipse(startX, startY, radius * 2);
                break;
            case 'triangle':
                const midX = startX + (endX - startX) / 2;
                triangle(startX, endY, midX, startY, endX, endY);
                break;
            case 'ellipse':
                const rx = abs(startX - endX);
                const ry = abs(startY - endY);
                ellipse(startX, startY, rx * 2, ry * 2);
                break;
            case 'rightTriangle': // ★ 直角三角形のプレビューを追加
                triangle(startX, startY, endX, startY, endX, endY);
                break;
        }
        pop();
    }
}

function drawEditorUI() {
    push();
    resetMatrix();
    scale(globalScale);
    fill(255);
    textSize(18);
    textAlign(LEFT, BOTTOM);

    let modeText = `モード: ${editorEditMode.toUpperCase()}`;
    text(modeText, 10, 720 - 70);

    text(`図形選択: [1]四角形 [2]円 [3]三角形 [4]楕円 [5]直角三角形`, 10, 720 - 50); // ★ UIテキスト更新
    text(`編集: [Z]削除 [C]移動 [V]タイプ変更`, 10, 720 - 30);
    text(`その他: [P]データ出力 | [T]タイトルへ`, 10, 720 - 10);
    pop();
}

function handleEditorMousePressed() {
    const clickPos = { x: mouseX / globalScale, y: mouseY / globalScale };
    const shapeUnderCursor = getShapeAtScreenPos(clickPos);

    switch (editorEditMode) {
        case 'place':
            editorIsDrawing = true;
            editorStartPos = clickPos;
            break;

        case 'delete':
            if (shapeUnderCursor) {
                const index = editorShapes.indexOf(shapeUnderCursor);
                if (index > -1) {
                    editorShapes.splice(index, 1);
                }
            }
            break;
            
        case 'rotate':
            if (shapeUnderCursor) {
                if (shapeUnderCursor.rotation === undefined) {
                    shapeUnderCursor.rotation = 0;
                }
                shapeUnderCursor.rotation += radians(15);
            }
            break;
            
        case 'move':
            if (shapeUnderCursor) {
                shapeBeingMoved = shapeUnderCursor;
                // ★ 移動開始時のマウスのワールド座標を記録
                const worldPos = createVector(clickPos.x + getCameraPosition().cameraX, clickPos.y + getCameraPosition().cameraY);
                lastMouseWorldPos = worldPos.copy();
            }
            break;

        case 'changeType':
            if (shapeUnderCursor) {
                shapeUnderCursor.type = (shapeUnderCursor.type % 2) + 1;
            }
            break;
    }
}

function handleEditorMouseReleased() {
    if (editorEditMode === 'move') {
        shapeBeingMoved = null;
        lastMouseWorldPos = null;
    }

    if (!editorIsDrawing) return;
    
    const { cameraX, cameraY } = getCameraPosition();
    const startX = editorStartPos.x + cameraX;
    const startY = editorStartPos.y + cameraY;
    const endX = (mouseX / globalScale) + cameraX;
    const endY = (mouseY / globalScale) + cameraY;

    let newShape;
    switch (editorCurrentShapeType) {
        case 'rect':
            newShape = { shape: 'rect', type: 1, rotation: 0, x: min(startX, endX), y: min(startY, endY), w: abs(startX - endX), h: abs(startY - endY) };
            break;
        case 'circle':
            newShape = { shape: 'circle', type: 1, rotation: 0, x: startX, y: startY, r: dist(startX, startY, endX, endY) };
            break;
        case 'triangle':
             const midX = startX + (endX - startX) / 2;
             newShape = { shape: 'triangle', type: 1, rotation: 0, x1: startX, y1: endY, x2: midX, y2: startY, x3: endX, y3: endY };
            break;
        case 'ellipse':
            newShape = { shape: 'ellipse', type: 1, rotation: 0, x: startX, y: startY, rx: abs(endX - startX), ry: abs(endY - startY) };
            break;
        case 'rightTriangle': // ★ 直角三角形のデータ作成
             newShape = { shape: 'triangle', type: 1, rotation: 0, x1: startX, y1: startY, x2: endX, y2: startY, x3: endX, y3: endY };
            break;
    }
    if (newShape) {
        // 全ての図形に rotation プロパティを初期値0で追加
        if(newShape.rotation === undefined) newShape.rotation = 0;
        editorShapes.push(newShape);
    }
    
    editorIsDrawing = false;
    editorStartPos = null;
    editorEndPos = null;
}

function handleEditorMouseDragged() {
    const currentMousePos = { x: mouseX / globalScale, y: mouseY / globalScale };

    if (editorEditMode === 'place' && editorIsDrawing) {
        editorEndPos = currentMousePos;
    } 
    else if (editorEditMode === 'move' && shapeBeingMoved) {
        const worldMousePos = createVector(currentMousePos.x + getCameraPosition().cameraX, currentMousePos.y + getCameraPosition().cameraY);
        
        // ★ 移動差分を計算して適用する方式に変更
        if (lastMouseWorldPos) {
            const moveVector = p5.Vector.sub(worldMousePos, lastMouseWorldPos);
            
            if (shapeBeingMoved.shape === 'triangle') {
                shapeBeingMoved.x1 += moveVector.x;
                shapeBeingMoved.y1 += moveVector.y;
                shapeBeingMoved.x2 += moveVector.x;
                shapeBeingMoved.y2 += moveVector.y;
                shapeBeingMoved.x3 += moveVector.x;
                shapeBeingMoved.y3 += moveVector.y;
            } else { // rect, circle, ellipse
                shapeBeingMoved.x += moveVector.x;
                shapeBeingMoved.y += moveVector.y;
            }
        }
        lastMouseWorldPos = worldMousePos.copy();
    }
}

function exportTerrainData() {
    console.log("--- COPY TERRAIN DATA BELOW ---");
    console.log(`terrain: ${JSON.stringify(editorShapes, null, 2)},`);
    console.log("--- COPY TERRAIN DATA ABOVE ---");
    alert("地形データがコンソールに出力されました。");
}

function sign(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

function getShapeAtScreenPos(screenPos) {
    const { cameraX, cameraY } = getCameraPosition();
    const worldPos = createVector(screenPos.x + cameraX, screenPos.y + cameraY);

    for (let i = editorShapes.length - 1; i >= 0; i--) {
        const shape = editorShapes[i];
        let collided = false;
        
        // ★★★ 当たり判定も回転を考慮する必要があります ★★★
        // 回転を考慮した当たり判定は複雑なため、ここでは未実装ですが、
        // 本来はクリック座標をシェイプの重心周りに逆回転させてから判定します。
        // let pointToCheck = worldPos.copy();
        // if (shape.rotation) { ... 逆回転処理 ... }

        switch (shape.shape) {
            case 'rect':
                if (worldPos.x >= shape.x && worldPos.x <= shape.x + shape.w &&
                    worldPos.y >= shape.y && worldPos.y <= shape.y + shape.h) {
                    collided = true;
                }
                break;
            case 'circle':
                if (dist(worldPos.x, worldPos.y, shape.x, shape.y) < shape.r) {
                    collided = true;
                }
                break;
            case 'ellipse':
                const dx = worldPos.x - shape.x;
                const dy = worldPos.y - shape.y;
                if ((dx * dx) / (shape.rx * shape.rx) + (dy * dy) / (shape.ry * shape.ry) < 1) {
                    collided = true;
                }
                break;
            case 'triangle':
                 const v1 = { x: shape.x1, y: shape.y1 };
                 const v2 = { x: shape.x2, y: shape.y2 };
                 const v3 = { x: shape.x3, y: shape.y3 };
                 const d1 = sign(worldPos, v1, v2);
                 const d2 = sign(worldPos, v2, v3);
                 const d3 = sign(worldPos, v3, v1);
                 const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
                 const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
                 if (!(has_neg && has_pos)) {
                     collided = true;
                 }
                break;
        }

        if (collided) {
            return shape;
        }
    }
    return null;
}