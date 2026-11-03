"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.editProfile = editProfile;
exports.downloadMyData = downloadMyData;
exports.deleteMyAccount = deleteMyAccount;
const zod_1 = require("zod");
const hotelService_1 = require("./hotelService");
const userModal_1 = require("../modals/userModal");
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    phone: zod_1.z.string().optional(),
});
async function getProfile(userId) {
    const user = await (0, userModal_1.findUserById)(userId);
    if (!user)
        throw new hotelService_1.HttpError(404, 'User not found');
    return user;
}
async function editProfile(userId, body) {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success)
        throw new hotelService_1.HttpError(400, parsed.error.issues[0].message);
    return (0, userModal_1.updateUserProfile)(userId, parsed.data.name, parsed.data.phone || null);
}
// Everything we hold about the user
function downloadMyData(userId) {
    return (0, userModal_1.exportUserData)(userId);
}
// Anonymise the account (admins are protected, so the site always has an admin)
async function deleteMyAccount(userId, role) {
    if (role === 'admin') {
        throw new hotelService_1.HttpError(403, 'Admin accounts cannot be deleted here. Ask another admin to change your role first.');
    }
    await (0, userModal_1.anonymiseUser)(userId);
}
