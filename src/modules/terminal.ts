import { Application } from "express";
import { Module } from "../module";
import { prisma } from "..";

// Import Proto
import * as wm from "../wmmt/wm5.proto";

// Import Util
import * as common from "./util/common";


export default class TerminalModule extends Module {
    register(app: Application): void {

        // Load terminal information - called when player uses the terminal
        // Request uses userId (not carId) in WMMT5
        app.post('/method/load_terminal_information', async (req, res) => {

            let body = wm.wm5.protobuf.LoadTerminalInformationRequest.decode(req.body);

            // Look up user to check maxi gold receivable status
            let user = await prisma.user.findFirst({
                where: { id: body.userId }
            });

            let msg = {
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
                maxiGoldReceivable: true,
                prizeReceivable: false,
                noticeEntries: [],
                noticeMessage: [],
                noticeWindow: [],
                noticeWindowMessage: [],
                transferNotice: {
                    needToSeeTransferred: false,
                    needToRenameCar: false,
                    needToRenameTeam: false,
                },
                announceFeature: false,
                freeScratched: false,
            };

            let message = wm.wm5.protobuf.LoadTerminalInformationResponse.encode(msg);
            common.sendResponse(message, res);
        });

        // Save terminal result - called when player exits the terminal
        app.post('/method/save_terminal_result', async (req, res) => {

            let body = wm.wm5.protobuf.SaveTerminalResultRequest.decode(req.body);

            // Update car order if provided
            if (body.carOrder && body.carOrder.length > 0) {
                await prisma.user.update({
                    where: { id: body.userId },
                    data: {
                        carOrder: body.carOrder,
                    }
                });
            }

            let msg = {
                error: wm.wm5.protobuf.ErrorCode.ERR_SUCCESS,
            };

            let message = wm.wm5.protobuf.SaveTerminalResultResponse.encode(msg);
            common.sendResponse(message, res);
        });
    }
}
