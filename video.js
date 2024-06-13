const { Op } = require("sequelize");
const { Sequelize } = require('sequelize');
var AWS = require("aws-sdk");
const fs = require('fs');
const db = require("../Models");
const fetch = require("node-fetch");
const moment = require('moment');
const http = require('http');
const https = require('https');
var path = require('path');
const { collectErrorLog } = require("../Controllers/ErrorLog");

const LearningVideo = db.LearningVideos;
const MatchVideo = db.MatchVideos;
const Match = db.Match;
const Tournament = db.Tournament;
const Users = db.AppUsers;
const Teams = db.Teams;
const PostMessageVideo = db.PostMessageVideos;
const AnalysisExternalCutVideo = db.AnalysisExternalCutVideo;
const Analysis = db.Analysis
const VideoFileTbl = db.VideoFileTbl;
const PushNotification = db.PushNotification;
const AppUserNotification = db.AppUserNotification;


exports.UploadFile = async (req, res, next) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		if (req.files == null) {
			next();
		} else {
			const fileContent = Buffer.from(req.files.file.data, "binary");
			const params = {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: req.body.category +
					"/" +
					req.body.sub_category1 +
					"/" +
					req.body.sub_category2 +
					"/" +
					Date.now().toString() +
					req.files.file.name,
				Body: fileContent,
			};

			s3.upload(params, async function (err, data) {
				if (err) {
					return res.status(400).json({ error: err, file: req.uploadedFile, status: false });
				}
				req.uploadedFile = data;
				next();
			});
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadFile", err, req.body, "");
		next();
	}
};


exports.GetMatchHightlights = async (req, res) => {
	try {
		if (req.body.tournamentID != undefined && req.body.matchID != undefined && req.body.inning != undefined) {
			var video = await MatchVideo.findAll({
				where: {
					match_centre_id: req.body.tournamentID,
					match_centre_category_id: req.body.matchID,
					inning: req.body.inning,
				}
			})
			if (video) {
				return res.status(200).json({ video: video, status: true });
			} else {
				return res.status(404).json({ msg: "Something went wrong. Please try again.", log: video, status: false });
			}
		} else {
			return res.status(404).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetMatchHightlights", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};




exports.AddVideo = async (req, res) => {
	try {
		if (req.body.category != undefined && req.body.title != undefined) {
			if (req.body.category === "1") {
				if (req.body.sub_category1 != undefined && req.body.sub_category2 != undefined) {
					var video = await LearningVideo.create({
						learning_centre_id: req.body.sub_category1,
						learning_centre_category_id: req.body.sub_category2,
						title: req.body.title,
						//generated image instead. 
						image: "https://dev.wellplayed.in/storage/app/public/learning_centre/4lRcNhbOgnBZMQQa7gEREyik3ucwoS1tKCsIVWCE.jpg",
						url: req.uploadedFile.Location,
						color: "[]",
						page: "learning_centre_play",
						params: "play",
						for_user_type: "Player/Coach",
						createdAt: new Date(),
						updatedAt: new Date(),
					});
					if (video) {
						return res.status(200).json({ video: video, file: req.uploadedFile, status: true });
					} else {
						return res.status(404).json({ msg: "Something went wrong. Please try again.", log: video, status: false });
					}
				} else {
					return res.status(200).json({ error: "Invalid Sub-categories", status: false });
				}
			} else if (req.body.category === "2") {
				var video = await MatchVideo.create({
					title: req.body.title,
					image: "https://dev.wellplayed.in/storage/app/public/match_centre/yIitfK5GaybB01yrr3M1l358dARgWy6Zth14Ijpw.jpg",
					url: req.uploadedFile.Location,
					color: "[]",
					page: "fun_centre_play",
					params: "play",
					for_user_type: "Player/Coach",
					position: 0,
					likes: 0,
					views: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				if (video) {
					return res.status(200).json({ video: video, file: req.uploadedFile, status: true });
				} else {
					return res.status(404).json({ msg: "Something went wrong. Please try again.", log: video, status: false });
				}
			} else if (req.body.category === "3") {
				if (req.body.sub_category1 != undefined && req.body.sub_category2 != undefined && req.body.inning != undefined) {
					var exist = await MatchVideo.findOne({
						where: {
							match_centre_id: req.body.sub_category1,
							match_centre_category_id: req.body.sub_category2,
							inning: req.body.inning,
						}
					})
					if (exist) {
						var deleted = await MatchVideo.destroy({
							where: {
								match_centre_id: req.body.sub_category1,
								match_centre_category_id: req.body.sub_category2,
								inning: req.body.inning,
							}
						})
						var video = await MatchVideo.create({
							match_centre_id: req.body.sub_category1,
							match_centre_category_id: req.body.sub_category2,
							inning: req.body.inning,
							title: req.body.title,
							// generated image instead
							image: "https://dev.wellplayed.in/storage/app/public/match_centre/yIitfK5GaybB01yrr3M1l358dARgWy6Zth14Ijpw.jpg",
							url: req.uploadedFile.Location,
							color: "[]",
							page: "match_centre_play",
							params: "play",
							for_user_type: "Player/Coach",
							position: 0,
							likes: 0,
							views: 0,
							createdAt: new Date(),
							updatedAt: new Date(),
						});
					} else {
						var video = await MatchVideo.create({
							match_centre_id: req.body.sub_category1,
							match_centre_category_id: req.body.sub_category2,
							inning: req.body.inning,
							title: req.body.title,
							//generated image instead
							image: "https://dev.wellplayed.in/storage/app/public/match_centre/yIitfK5GaybB01yrr3M1l358dARgWy6Zth14Ijpw.jpg",
							url: req.uploadedFile.Location,
							color: "[]",
							page: "match_centre_play",
							params: "play",
							for_user_type: "Player/Coach",
							position: 0,
							likes: 0,
							views: 0,
							createdAt: new Date(),
							updatedAt: new Date(),
						});
					}
					if (video) {
						return res.status(200).json({ video: video, file: req.uploadedFile, status: true });
					} else {
						return res.status(404).json({ msg: "Something went wrong. Please try again.", log: video, status: false });
					}
				} else {
					return res.status(200).json({ error: "Invalid Sub-categories", status: false });
				}
			} else if (req.body.category === "4") {
				var video = await PostMessageVideo.create({
					title: req.body.title,
					message: req.body.message,
					//generated image instead
					image: "https://dev.wellplayed.in/storage/app/public/match_centre/yIitfK5GaybB01yrr3M1l358dARgWy6Zth14Ijpw.jpg",
					url: req.uploadedFile.Location,
					color: "[]",
					page: "post_centre_play",
					params: "play",
					for_user_type: "Player/Coach",
					position: 0,
					likes: 0,
					views: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				if (video) {
					return res.status(200).json({ video: video, file: req.uploadedFile, status: true });
				} else {
					return res.status(404).json({ msg: "Something went wrong. Please try again.", log: video, status: false });
				}
			}
		} else {
			return res.status(404).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UploadMatchFileInLocalAndAWS = async (req, res, next) => {
	try {
		if (req.files != null) {
			let uploadPath = process.cwd() + '/public/match_video/' + req.files.file.name;
			let newUploadPath = 'public/match_video/' + req.files.file.name;
			await req.files.file.mv(uploadPath, function (err) {
				if (err) {
					//logger.info("Error");
				} else {
					var selected_attachment_data = {
						file_name: req.files.file.name,
						fullpath: newUploadPath,
						status: "uploaddone"
					}

					req.selected_attachment_data = selected_attachment_data;

					AWS.config.update({
						region: process.env.S3_REGION,
						accessKeyId: process.env.AWS_ACCESS_KEY,
						secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
					});
					const s3 = new AWS.S3();
					const fileContent = fs.readFileSync(selected_attachment_data.fullpath);
					const params = {
						Bucket: process.env.AWS_BUCKET_NAME,
						Key: "well_played_tournament/video_zip/" + selected_attachment_data.file_name,
						Body: fileContent,
					};
					s3.upload(params, async function (err, data) {
						if (err) {
							req.body['files'] = req.files;
							req.selected_attachment_data.status = "uploadfailed";
							collectErrorLog(path.basename(__filename), "UploadMatchFileInLocalAndAWS + AWS", err, req.body, "");
							this.AddMatchVideo(req);
							return res.status(400).json({ error: err, msg: "AWS Upload Failed.", status: false });
						}
						req.uploadedFile = data;
						next();
					});
				}
			});
		} else {
			req.selected_attachment_data.status = "uploadfailed";
			next();
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadMatchFileInLocalAndAWS", err, req.body, "");
		next();
	}
};


exports.UploadMatchFileInLocal = async (req, res, next) => {
	try {
		if (req.files != null) {
			let uploadPath = process.cwd() + '/public/match_video/' + req.files.file.name;
			let newUploadPath = 'public/match_video/' + req.files.file.name;
			await req.files.file.mv(uploadPath, function (err) {
				if (err) {
					collectErrorLog(path.basename(__filename), "UploadMatchFileInLocal + local", err, req.body, "");

					return res.status(400).json({ error: err, msg: "local Upload Failed.", status: false });
				} else {
					var selected_attachment_data = {
						file_name: req.files.file.name,
						fullpath: newUploadPath,
						status: "uploaddone"
					}
					req.selected_attachment_data = selected_attachment_data;
					next();
				}
			});
		} else {
			collectErrorLog(path.basename(__filename), "UploadMatchFileInLocal", { "error": "Zip file is not received" }, req.body, "");
			var selected_attachment_data = {
				status: "uploadfailed"
			}
			req.selected_attachment_data = selected_attachment_data;
			next();
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadMatchFileInLocal", err, req.body, "");
		next();
	}
};


exports.UploadMatchFile = async (req, res, next) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fileContent = fs.readFileSync(req.selected_attachment_data.fullpath);
		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: "well_played_tournament/video_zip/" + req.selected_attachment_data.file_name,
			Body: fileContent,
		};
		s3.upload(params, async function (err, data) {
			if (err) {
				collectErrorLog(path.basename(__filename), "UploadMatchFile + aws", err, req.body, "");

				return res.status(400).json({ error: err, file: req.uploadedFile, status: false });
			}
			req.uploadedFile = data;
			next();
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadMatchFile", err, req.body, "");
		next();
	}
};


exports.AddMatchVideo = async (req, res) => {
	try {
		var video = await VideoFileTbl.update({
			status: req.selected_attachment_data.status,
		}, {
			where: {
				zip_filepath: req.body.zipFileName,
			},
		});
		if (video) {
			return res.status(200).json({ video: video, file: req.uploadedFile, status: true, video_status: req.selected_attachment_data.status });
		} else {
			return res.status(400).json({ msg: "Something went wrong. Please try again.", status: false, video_status: req.selected_attachment_data.status });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddMatchVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.AddMatchVideoStatus = async (req, res) => {
	try {
		var videoExist2 = await VideoFileTbl.findAll({
			where: {
				zip_filepath: req.body.filename
			},
		});
		if (videoExist2 == "") {
			var video = await VideoFileTbl.create({
				filepath: null,
				zip_filepath: req.body.filename,
				date: new Date(),
				status: req.body.status,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			if (video) {
				return res.status(200).json({ video: video, status: true });
			} else {
				return res.status(404).json({ msg: "Something went wrong. Please try again.", status: false });
			}
		} else {
			var video = await VideoFileTbl.update({
				filepath: null,
				zip_filepath: req.body.filename,
				date: new Date(),
				status: req.body.status,
				updatedAt: new Date(),
			}, {
				where: {
					fileid: videoExist2[0]["fileid"]
				},
			});
			if (video) {
				return res.status(200).json({ video: video, status: true });
			} else {
				return res.status(404).json({ msg: "Something went wrong. Please try again.", status: false });
			}
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddMatchVideoStatus", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UpdateMatchVideoStatus = async (req, res) => {
	try {
		var video = await VideoFileTbl.update({
			status: req.body.status,
		}, {
			where: {
				zip_filepath: req.body.filename,
			},
		});
		if (video) {
			return res.status(200).json({ video: video, status: true });
		} else {
			return res.status(404).json({ msg: "Something went wrong. Please try again.", status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UpdateMatchVideoStatus", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetMatchVideos = async (req, res) => {
	try {
		if (req.body.filter_type != "") {
			if (req.body.filter_type != undefined) {
				var video = await VideoFileTbl.findAll({
					where: {
						filepath: {
							[Op.like]: req.body.filter_type + '%'
						},
					}
				})
				return res.status(200).json({ videoList: video, success: "1", msg: "0" });
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetMatchVideos", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DivideMatchVideos = async (req, res) => {
	try {
		const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
		var ffmpeg = require('fluent-ffmpeg');
		ffmpeg.setFfmpegPath(ffmpegPath);

		ffmpeg('https://firebasestorage.googleapis.com/v0/b/react-live-stream-e918a.appspot.com/o/MyReactStream%2FVNIT%20Premier%20League_VPL%2023%20Final_VNIT%20Team%20C_2023-03-18_Over_FI_8.5.mp4?alt=media')
			.setStartTime('00:00:02')
			.setDuration(2)
			.output('public/compress_video/outvideofile.mp4')
			.on('end', function (err) {
				if (!err) {
					console.log('successfully converted');
				}
			})
			.on('error', function (err) {
				console.log('conversion error: ', err);
			}).run();
	} catch (err) {
		collectErrorLog(path.basename(__filename), "DivideMatchVideos", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UnzipMatchVideos = async (req, res) => {
	const stream = require('stream');
	AWS.config.update({
		region: process.env.S3_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
	});
	const s3 = new AWS.S3();

	// Specify the S3 bucket name and key of the file to unzip
	const bucketName = process.env.AWS_BUCKET_NAME;
	const zipName = 'Admin Match_Student 11 Vs Final 11_VNIT Team C_2023-04-07_Over_FI_0.1.zip';
	const fileNameWithoutExtension = zipName.split('.').slice(0, -1).join('.');

	const fileName = fileNameWithoutExtension + '.mp4';
	const fileKey = 'well_played_tournament/video_zip/' + zipName;

	// Function to unzip a file in S3 bucket
	const unzipFileInS3Bucket = async (bucketName, fileKey) => {
		try {
			// Get the zipped file from S3
			const getObjectParams = {
				Bucket: bucketName,
				Key: fileKey
			};

			const fileData = await s3.getObject(getObjectParams).promise();

			// Unzip the file using a library like 'adm-zip' or 'unzipper'
			// In this example, we'll use 'unzipper' library
			const Unzipper = require('unzipper');

			// Create a readable stream from the zipped file data
			const readableStream = new stream.PassThrough();
			readableStream.end(fileData.Body);

			// Unzip the file using 'unzipper' library
			const extractedPath = 'public/video_zip';
			await readableStream.pipe(Unzipper.Extract({ path: extractedPath })).promise();

			const s3UploadPath = 'well_played_tournament/video_zip/';

			//await this.UploadUnzipFileToServer(s3UploadPath, extractedPath, fileName);

			return res.status(200).json({ success: "1", "msg": "File unzipped successfully" });

		} catch (err) {
			collectErrorLog(path.basename(__filename), "UnzipMatchVideos", err, req.body, "");

			return res.status(400).json({
				msg: "Something went wrong. Please try again.",
				status: false,
				error: err,
			});
		}
	};

	// Call the function to unzip the file
	unzipFileInS3Bucket(bucketName, fileKey)
		.then(() => {
			console.log('File unzipped successfully');
		})
		.catch((err) => {
			console.error('Error unzipping file:', err);
		});
};


exports.UploadUnzipFileToServer = async (s3UploadPath, extractedPath, fileName) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fs_new = require('fs').promises;

		const fileContent = await fs_new.readFile(`${extractedPath}/${fileName}`);

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `${s3UploadPath}${fileName}`,
			Body: fileContent,
		};

		const data = await s3.upload(params).promise(); // Use .promise() to await the upload operation

		return { status: true, message: 'Upload successful' };
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["s3UploadPath"] = s3UploadPath;
		combine_return_variable["extractedPath"] = extractedPath;
		combine_return_variable["fileName"] = fileName;

		collectErrorLog(path.basename(__filename), "UploadUnzipFileToServer", err, combine_return_variable, "");

		return false;
	}
};


exports.UploadUnzipFileToServer_backup = async (s3UploadPath, extractedPath, fileName) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fileContent = fs.readFileSync(extractedPath + '/' + fileName);

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: s3UploadPath + fileName,
			Body: fileContent,
		};

		await s3.upload(params, async function (err, data) {
			// console.log("Upload Process - 1")
			if (err) {
				res.status(400).json({ error: err, file: s3UploadPath, status: false });
			}
		});
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["s3UploadPath"] = s3UploadPath;
		combine_return_variable["extractedPath"] = extractedPath;
		combine_return_variable["fileName"] = fileName;

		collectErrorLog(path.basename(__filename), "UploadUnzipFileToServer_backup", err, combine_return_variable, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DeCompressAllVideos = async (req, res) => {
	try {
		var allVideoFileTbl = await VideoFileTbl.findAll({
			where: {
				filepath: null,
				zip_filepath: {
					[Op.not]: ''
				},
				status: 'uploaddone'
			}
		});

		if (allVideoFileTbl.length > 0) {
			for (var i = 0; i < allVideoFileTbl.length; i++) {
				let uploadedFileName = await this.UnzipMatchVideosFromZip(allVideoFileTbl[i]["zip_filepath"]);
				let updateFilenameInVideoFileTbl = await this.updateFilenameInVideoFileTbl(allVideoFileTbl[i]["fileid"], uploadedFileName);
			}
		}

		return res.status(200).json({ success: "success", "msg": "File unzipped successfully" });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "DeCompressAllVideos", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UnzipMatchVideosFromZip = async (zipName) => {
	const stream = require('stream');
	AWS.config.update({
		region: process.env.S3_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
	});
	const s3 = new AWS.S3();

	// Specify the S3 bucket name and key of the file to unzip
	const bucketName = process.env.AWS_BUCKET_NAME;
	//const zipName = 'Admin Match_Student 11 Vs Final 11_VNIT Team C_2023-04-07_Over_FI_0.1.zip';
	const fileNameWithoutExtension = zipName.split('.').slice(0, -1).join('.');

	const fileName = fileNameWithoutExtension + '.mp4';
	//console.log("fileName", fileName);
	const fileKey = 'well_played_tournament/video_zip/' + zipName;

	// Function to unzip a file in S3 bucket
	const unzipFileInS3Bucket = async (bucketName, fileKey) => {

		try {
			// Get the zipped file from S3
			const getObjectParams = {
				Bucket: bucketName,
				Key: fileKey
			};
			//console.log("getObjectParams", getObjectParams)
			const fileData = await s3.getObject(getObjectParams).promise();

			// Unzip the file using a library like 'adm-zip' or 'unzipper'
			// In this example, we'll use 'unzipper' library
			const Unzipper = require('unzipper');

			// Create a readable stream from the zipped file data
			const readableStream = new stream.PassThrough();
			readableStream.end(fileData.Body);

			// Unzip the file using 'unzipper' library
			const extractedPath = 'public/video_zip';
			await readableStream.pipe(Unzipper.Extract({ path: extractedPath })).promise();

			const s3UploadPath = 'well_played_tournament/';

			await this.UploadUnzipFileToServer(s3UploadPath, extractedPath, fileName);
			// console.log("Upload Process - 2")
			return fileName;

		} catch (err) {
			let combine_return_variable = {};
			combine_return_variable["zipName"] = zipName;

			collectErrorLog(path.basename(__filename), "UnzipMatchVideosFromZip", err, combine_return_variable, "");

			return false
		}
	}

	// Call the function to unzip the file
	await unzipFileInS3Bucket(bucketName, fileKey)
		.then(() => {
			//console.log('File unzipped successfully');
		})
		.catch((err) => {
			//console.error('Error unzipping file:', err);
		});

	return fileName;
};


exports.updateFilenameInVideoFileTbl = async (fileid, filepath) => {
	try {
		await VideoFileTbl.update({
			filepath: filepath
		}, {
			where: {
				fileid: fileid
			},
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["fileid"] = fileid;
		combine_return_variable["filepath"] = filepath;

		collectErrorLog(path.basename(__filename), "updateFilenameInVideoFileTbl", err, combine_return_variable, "");

		return false;
	}
};


exports.MatchUnzipList = async (req, res) => {
	try {
		var allVideoFileTbl = await VideoFileTbl.findAll({
			where: {
				filepath: null,
				//zip_filepath: { [Op.not]: '' },
				zip_filepath: {
					[Op.like]: req.body.filter_type + '%'
				},
				status: 'uploaddone'
			}
		});
		if (allVideoFileTbl.length > 0) {
			for (var i = 0; i < allVideoFileTbl.length; i++) {
				let uploadedFileName = await this.UnzipMatchVideosFromZip(allVideoFileTbl[i]["zip_filepath"]);
				let updateFilenameInVideoFileTbl = await this.updateFilenameInVideoFileTbl(allVideoFileTbl[i]["fileid"], uploadedFileName);
			}
		}

		return res.status(200).json({ success: "success", "msg": "File unzipped successfully" });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "MatchUnzipList", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.CropVideoFromUrl = async (req, res) => {
	try {
		const fileUrl = "https://stream.mux.com/DoyqQYSaw023wOgawlR2oIi02pA5m01NdGe7afHnNvgtIE.m3u8";
		const fileName = 'public/mux_video/LiveStreamVideo.m3u8'; // replace with your desired file name

		const file = fs.createWriteStream(fileName);

		const request = https.get(fileUrl, function (response) {
			response.pipe(file);
		});

		request.on('error', function (err) {
			//console.error("requestrequest_error", err);
		});

		file.on('finish', function () {
			file.close();
			// console.log('Downloaded successfully');

			const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
			var ffmpeg = require('fluent-ffmpeg');
			ffmpeg.setFfmpegPath(ffmpegPath);

			ffmpeg(fileName)
				.setStartTime('00:00:12')
				.setDuration(7)
				.output('public/mux_video/outvideofile.m3u8')
				.on('end', function (err) {
					if (!err) {
						return res
							.status(200)
							.json({ success: "success", "msg": "File successfully converted" });
						//console.log('successfully converted');
					}
				})
				.on('error', function (err) {
					console.log('conversion error: ', err);
				}).run();
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "CropVideoFromUrl", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetLiveAnalysisDetail = async (req, res) => {
	try {
		if (req.body.analysis_master_id != "") {
			if (req.body.analysis_master_id != undefined) {
				var analysis_master = await db.AnalysisMaster.findAll({
					where: {
						id: req.body.analysis_master_id
					}
				});

				if (analysis_master.length > 0) {
					let analysis_master_id = req.body.analysis_master_id;
					const tournament = await this.Tournaments(analysis_master[0].tournament_id);
					let tournament_name = tournament ? tournament.name : "";

					const match = await this.Matches(analysis_master[0].match_id);
					let match_name = match ? match.name : "";
					let match_date = match ? match.date : "";

					const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
					let team_bat1 = battingTeam1 ? battingTeam1.name : "";

					const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
					let team_bat2 = battingTeam2 ? battingTeam2.name : "";

					const Camera1UserName = await this.UserDetail(analysis_master[0].Camera1User);
					let Camera1UserFullName = Camera1UserName ? Camera1UserName.full_name : "";

					const Camera2UserName = await this.UserDetail(analysis_master[0].Camera2User);
					let Camera2UserFullName = Camera2UserName ? Camera2UserName.full_name : "";

					let full_tournament_name;
					if (analysis_master[0].current_inning == 1) {
						full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date;
					} else {
						full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date;
					}

					analysis_master[0].dataValues.tournament_name = tournament_name;
					analysis_master[0].dataValues.match_name = match_name;
					analysis_master[0].dataValues.match_date = match_date;
					analysis_master[0].dataValues.team_bat1 = team_bat1;
					analysis_master[0].dataValues.team_bat2 = team_bat2;
					analysis_master[0].dataValues.full_tournament_name = full_tournament_name;
					analysis_master[0].dataValues.Camera1UserName = Camera1UserFullName;
					analysis_master[0].dataValues.Camera2UserName = Camera2UserFullName;
				}

				return res.status(200).json({ AnalysisMasterDetail: analysis_master, success: "1", "msg": "0" });
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetLiveAnalysisDetail", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}

};


exports.UserDetail = async (user_id) => {
	try {
		const user_details = await Users.findOne({
			where: {
				id: user_id
			},
		});
		return user_details;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["user_id"] = user_id;

		collectErrorLog(path.basename(__filename), "UserDetail", err, combine_return_variable, "");

		return false;
	}
};


exports.Tournaments = async (tournament_id) => {
	try {
		const tournament_details = await Tournament.findOne({
			where: {
				id: tournament_id
			},
		});
		return tournament_details;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["tournament_id"] = tournament_id;

		collectErrorLog(path.basename(__filename), "Tournaments", err, combine_return_variable, "");

		return false;
	}
};


exports.Matches = async (match_id) => {
	try {
		const match_details = await Match.findOne({
			where: {
				id: match_id
			},
		});
		return match_details;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["match_id"] = match_id;

		collectErrorLog(path.basename(__filename), "Matches", err, combine_return_variable, "");

		return false;
	}
};


exports.firstBatTeam = async (bat1_id) => {
	try {
		const first_bat_team = await Teams.findOne({
			where: {
				id: bat1_id
			},
		});
		return first_bat_team;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["bat1_id"] = bat1_id;

		collectErrorLog(path.basename(__filename), "firstBatTeam", err, combine_return_variable, "");

		return false;
	}
};


exports.GetStartAnalysisDetail = async (req, res) => {
	try {
		if (req.body.tournament_id != "") {
			if (req.body.tournament_id != undefined) {
				var analysis_master = await db.AnalysisMaster.findAll({
					where: {
						tournament_id: req.body.tournament_id,
						match_id: req.body.match_id
					}
				});

				if (analysis_master.length > 0) {
					let analysis_master_id = req.body.analysis_master_id;
					const tournament = await this.Tournaments(analysis_master[0].tournament_id);
					let tournament_name = tournament ? tournament.name : "";

					const match = await this.Matches(analysis_master[0].match_id);
					let match_name = match ? match.name : "";
					let match_date = match ? match.date : "";

					const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
					let team_bat1 = battingTeam1 ? battingTeam1.name : "";

					const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
					let team_bat2 = battingTeam2 ? battingTeam2.name : "";

					const Camera1UserName = await this.UserDetail(analysis_master[0].Camera1User);
					let Camera1UserFullName = Camera1UserName ? Camera1UserName.full_name : "";

					const Camera2UserName = await this.UserDetail(analysis_master[0].Camera2User);
					let Camera2UserFullName = Camera2UserName ? Camera2UserName.full_name : "";

					let full_tournament_name;
					if (analysis_master[0].current_inning == 1) {
						full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date;
					} else {
						full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date;
					}

					analysis_master[0].dataValues.tournament_name = tournament_name;
					analysis_master[0].dataValues.match_name = match_name;
					analysis_master[0].dataValues.match_date = match_date;
					analysis_master[0].dataValues.team_bat1 = team_bat1;
					analysis_master[0].dataValues.team_bat2 = team_bat2;
					analysis_master[0].dataValues.full_tournament_name = full_tournament_name;
					analysis_master[0].dataValues.Camera1UserName = Camera1UserFullName;
					analysis_master[0].dataValues.Camera2UserName = Camera2UserFullName;
				}

				return res.status(200).json({ AnalysisMasterDetail: analysis_master, success: "1", "msg": "0" });
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetStartAnalysisDetail", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UpdateLiveStreamingDetail = async (req, res) => {
	try {
		if (req.body.livePlaybackId != "") {
			if (req.body.livePlaybackId != undefined) {
				var live_streaming = await db.LiveStreamingTbl.findAll({
					where: {
						live_playback_id: req.body.livePlaybackId
					}
				});

				if (live_streaming.length == 0) {
					var analysis_master = await db.AnalysisMaster.findAll({
						where: {
							id: req.body.analysis_master_id
						}
					});

					let full_tournament_name;
					if (analysis_master.length > 0) {
						let analysis_master_id = req.body.analysis_master_id;
						const tournament = await this.Tournaments(analysis_master[0].tournament_id);
						let tournament_name = tournament ? tournament.name : "";

						const match = await this.Matches(analysis_master[0].match_id);
						let match_name = match ? match.name : "";
						let match_date = match ? match.date : "";

						const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
						let team_bat1 = battingTeam1 ? battingTeam1.name : "";

						const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
						let team_bat2 = battingTeam2 ? battingTeam2.name : "";

						let new_over = parseInt(req.body.over) + 1;
						if (req.body.inning == 1) {
							full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI_' + new_over;
						} else {
							full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI_' + new_over;
						}
					}

					const now = new Date();
					const year = now.getFullYear();
					const month = now.getMonth() + 1; // month is 0-indexed, so add 1 to get the actual month number
					const day = now.getDate();
					const hours = now.getHours();
					const minutes = now.getMinutes();
					const seconds = now.getSeconds();

					full_tournament_name = full_tournament_name + '_' + hours + '_' + minutes + '_' + seconds;

					// console.log("req.body.livePlaybackIdreq.body.livePlaybackIdreq.body.livePlaybackId", req.body.livePlaybackId)
					var created_live_streaming = await db.LiveStreamingTbl.create({
						analysis_master_id: req.body.analysis_master_id,
						video_file_name: full_tournament_name,
						live_playback_id: req.body.livePlaybackId,
						asset_id: req.body.asset_id,
						live_stream_key: req.body.stream_key,
						is_available_aws: 'pending',
						createdAt: new Date(),
						updatedAt: new Date(),
					});

					return res.status(200).json({ created_live_streaming: created_live_streaming, success: "1", "msg": "0" });
				} else {
					return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
				}
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UpdateLiveStreamingDetail", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DownloadMuxUploadAwsServer_BackUp = async (req, res) => {
	try {
		if (req.params.analysis_master_id != "") {
			if (req.params.analysis_master_id != undefined) {

				var live_streaming = await db.LiveStreamingTbl.findAll({
					attributes: [
						[Sequelize.literal('DISTINCT(`asset_id`)'), 'asset_id'],
						'video_file_name',
						'analysis_master_id',
						'live_playback_id',
						'live_stream_key',
						'aws_server_path',
						'is_available_aws',
						'mux_file_path'
					],
					where: {
						analysis_master_id: req.params.analysis_master_id
					},
					limit: 1
				});

				if (live_streaming.length > 0) {
					for (var i = 0; i < live_streaming.length; i++) {
						let asset_id = live_streaming[0].asset_id;

						const encoded = Buffer.from(process.env.MUX_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64');

						fetch('https://api.mux.com/video/v1/assets/' + asset_id, {
							method: "GET",
							//body: {},
							headers: {
								"Content-type": "application/json; charset=UTF-8",
								'Authorization': 'Basic ' + encoded,
							},
						}).then((response) => {
							response.json();
						}).then((json) => {
							if (json.data.static_renditions.status == 'ready') {
								let video_files = json.data.static_renditions.files;
								let file_name;
								if (video_files.length > 0) {
									file_name = "high.mp4";
								}
							}
						}).catch((err) => console.log(err));
					}
				}
				return res.status(200).json({ live_streaming: live_streaming, success: "1", "msg": "0" });
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "DownloadMuxUploadAwsServer_BackUp", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DownloadMuxUploadAwsServer = async (req, res) => {
	try {
		if (req.params.analysis_master_id != "") {
			if (req.params.analysis_master_id != undefined) {
				let self = this;
				var live_streaming = await db.LiveStreamingTbl.findAll({
					attributes: [
						[Sequelize.literal('DISTINCT(`asset_id`)'), 'asset_id'],
						'video_file_name',
						'analysis_master_id',
						'live_playback_id',
						'live_stream_key',
						'aws_server_path',
						'is_available_aws',
						'mux_file_path'
					],
					where: {
						analysis_master_id: req.params.analysis_master_id,
						is_available_aws: 'pending'
					},
					//limit: 10
				});

				let document_uploaded_num = 0;

				if (live_streaming.length > 0) {
					for (var i = 0; i < live_streaming.length; i++) {
						let asset_id = live_streaming[i].asset_id;
						let video_file_name = live_streaming[i].video_file_name;

						const encoded = Buffer.from(process.env.MUX_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64');

						fetch(process.env.MUX_ASSET_PATH + asset_id, {
							method: "GET",
							//body: {},
							headers: {
								"Content-type": "application/json; charset=UTF-8",
								'Authorization': 'Basic ' + encoded,
							},
						}).then((response) => {
							response.json();
						}).then((json) => {
							if (typeof json.error == "undefined") {
								if (typeof json.data.static_renditions != "undefined") {
									if (json.data.static_renditions.status == "preparing") {
										document_uploaded_num++;

										if (live_streaming.length == document_uploaded_num) {
											return res.status(200).json({ live_streaming: live_streaming, success: "1", "msg": "0" });
										}
									} else if (json.data.static_renditions.status == 'ready') {
										let video_files = json.data.static_renditions.files;
										let file_name;
										if (video_files.length > 0) {
											file_name = "high.mp4";
										}
										let playback_ids = json.data.playback_ids;

										let playback_id;
										if (playback_ids.length > 0) {
											playback_id = playback_ids[0].id;
										}

										let full_video_path;
										full_video_path = process.env.MUX_STORAGE_PATH + playback_id + "/high.mp4";
										// console.log("full_video_path", full_video_path);
										const fileUrl = full_video_path;

										const fileName = 'public/mux_video/' + video_file_name + '.mp4'; // replace with your desired file name

										const file = fs.createWriteStream(fileName);

										const request = https.get(fileUrl, function (response) {
											response.pipe(file);
										});

										request.on('error', function (err) {
											//console.error("requestrequest_error", err);
										});

										file.on('finish', async function () {
											file.close();

											const s3UploadPath = 'mux_server_file/';
											const extractedPath = 'public/mux_video';
											const fileName = video_file_name + '.mp4';
											await self.UploadAWSFromMuxServer(s3UploadPath, extractedPath, fileName);
											await self.UpdateAWSUrlInLiveStreaming(asset_id, fileName);
											document_uploaded_num++;

											if (live_streaming.length == document_uploaded_num) {
												return res.status(200).json({ live_streaming: live_streaming, success: "1", "msg": "0" });
											}
										});
									} else {
										document_uploaded_num++;

										if (live_streaming.length == document_uploaded_num) {
											return res.status(200).json({ live_streaming: live_streaming, success: "1", "msg": "0" });
										}
									}
								} else {
									document_uploaded_num++;

									if (live_streaming.length == document_uploaded_num) {
										return res.status(200).json({ live_streaming: live_streaming, success: "1", "msg": "0" });
									}
								}
							} else {
								document_uploaded_num++;

								if (live_streaming.length == document_uploaded_num) {
									return res.status(200).json({ live_streaming: live_streaming, success: "1", "msg": "0" });
								}
							}
						}).catch((err) => console.log(err));
					}
				} else {
					return res.status(200).json({ live_streaming: live_streaming, success: "1", "msg": "0" });
				}
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "DownloadMuxUploadAwsServer", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UpdateAWSUrlInLiveStreaming = async (asset_id, aws_server_path) => {
	try {
		var LiveStreamingTbl = await db.LiveStreamingTbl.update({
			aws_server_path: aws_server_path,
			is_available_aws: 'completed'
		}, {
			where: {
				asset_id: asset_id
			}
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["asset_id"] = asset_id;
		combine_return_variable["aws_server_path"] = aws_server_path;

		collectErrorLog(path.basename(__filename), "UpdateAWSUrlInLiveStreaming", err, combine_return_variable, "");

		return false;
	}
};


exports.UploadAWSFromMuxServer = async (s3UploadPath, extractedPath, fileName) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fileContent = fs.readFileSync(extractedPath + '/' + fileName);

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: s3UploadPath + fileName,
			Body: fileContent,
		};

		await s3.upload(params, async function (err, data) {
			if (err) {
				return res.status(400).json({ error: err, file: s3UploadPath, status: false });
			}
		});
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["s3UploadPath"] = s3UploadPath;
		combine_return_variable["extractedPath"] = extractedPath;
		combine_return_variable["fileName"] = fileName;

		collectErrorLog(path.basename(__filename), "UploadAWSFromMuxServer", err, combine_return_variable, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.CropAndTagAllLiveVideo = async (req, res) => {
	try {
		let self = this;
		let increment_num = 0;

		if (req.params.analysis_master_id != "") {
			if (req.params.analysis_master_id != undefined) {

				var analysis_data = await db.Analysis.findAll({
					where: {
						analysis_master_id: req.params.analysis_master_id,
						start_time: {
							[Op.not]: null
						},
						end_interval: {
							[Op.not]: null
						},
						[Op.or]: [
							{ video_url: "" },
							{ video_url: null }
						]
					},
					//limit: 1
				});

				if (analysis_data.length > 0) {
					for (var i = 0; i < analysis_data.length; i++) {
						var analysis_master = await db.AnalysisMaster.findAll({
							where: {
								id: analysis_data[i].analysis_master_id
							}
						});

						let full_tournament_name;
						let full_video_name;

						if (analysis_master.length > 0) {
							let analysis_master_id = analysis_data[i].analysis_master_id;
							const tournament = await this.Tournaments(analysis_master[0].tournament_id);
							let tournament_name = tournament ? tournament.name : "";

							const match = await this.Matches(analysis_master[0].match_id);
							let match_name = match ? match.name : "";
							let match_date = match ? match.date : "";

							const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
							let team_bat1 = battingTeam1 ? battingTeam1.name : "";

							const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
							let team_bat2 = battingTeam2 ? battingTeam2.name : "";

							let new_over = Math.ceil(analysis_data[i].current_ball);
							if (analysis_data[i].current_inning == 1) {
								full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI_' + new_over;
								full_video_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI_' + analysis_data[i].current_ball;
							} else {
								full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI_' + new_over;
								full_video_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI_' + analysis_data[i].current_ball;
							}

							var live_streaming = await db.LiveStreamingTbl.findAll({
								attributes: [
									[Sequelize.literal('DISTINCT(`asset_id`)'), 'asset_id'],
									'video_file_name',
									'analysis_master_id',
									'live_playback_id',
									'live_stream_key',
									'aws_server_path',
									'is_available_aws',
									'mux_file_path'
								],
								where: {
									analysis_master_id: req.params.analysis_master_id,
									video_file_name: {
										[Op.like]: full_tournament_name + '%'
									},
									is_available_aws: 'completed'
								},
								//limit: 10
							});

							if (live_streaming.length > 0) {
								for (var j = 0; j < live_streaming.length; j++) {
									if ((live_streaming[j].aws_server_path != null) && (live_streaming[j].aws_server_path != "")) {
										const fileUrl = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/mux_server_file/" + live_streaming[j].aws_server_path;

										const fileName = 'public/aws_mux_download_video/' + live_streaming[j].aws_server_path; // replace with your desired file name

										const file = fs.createWriteStream(fileName);
										const request = https.get(fileUrl, function (response) {
											response.pipe(file);
										});

										request.on('error', function (err) {
											//console.error("requestrequest_error", err);
										});

										let cut_file_name = full_video_name + '.mp4';
										let start_time = analysis_data[i].start_time;
										let end_interval = analysis_data[i].end_interval;
										let analysis_id = analysis_data[i].id;

										file.on('finish', async function () {
											file.close();

											const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
											var ffmpeg = require('fluent-ffmpeg');
											ffmpeg.setFfmpegPath(ffmpegPath);

											ffmpeg(fileName)
												.setStartTime(start_time)
												.setDuration(end_interval)
												.output('public/mux_cut_video/' + cut_file_name)
												.on('end', async function (err) {
													if (!err) {
														// console.log('successfully converted');
														const s3UploadPath = 'well_played_tournament/';
														const extractedPath = 'public/mux_cut_video';
														const fileName = cut_file_name;
														await self.UploadAWSCutVideo(s3UploadPath, extractedPath, fileName);

														const cut_analysis_video = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + cut_file_name;
														const cut_analysis_thumbnail = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/video_thumbnails" + cut_file_name;
														await self.UpdateVideoUrlInAnalysis(analysis_id, cut_analysis_video)
														await self.UpdateThumbnailUrlInAnalysisCRON(analysis_id, cut_analysis_thumbnail)

														await self.UpdateVideoInTbl(cut_file_name);

														increment_num++;

														if (analysis_data.length == increment_num) {
															return res.status(200).json({ live_streaming: analysis_data, success: "1", "msg": "0" });
														}
													}
												})
												.on('error', function (err) {
													console.log('conversion error: ', err);
												}).run();
										});
									}
								}
							} else {
								increment_num++;

								if (analysis_data.length == increment_num) {
									return res.status(200).json({ live_streaming: analysis_data, success: "1", "msg": "0" });
								}
							}
						}
					}
				} else {
					return res.status(200).json({ live_streaming: [], success: "0", "msg": "0" });
				}
			} else {
				return res.status(200).json({ live_streaming: [], success: "0", "msg": "0" });
			}
		} else {
			return res.status(200).json({ live_streaming: [], success: "0", "msg": "0" });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "CropAndTagAllLiveVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UpdateVideoInTbl = async (filepath) => {
	try {
		var videoExist = await VideoFileTbl.findAll({
			where: {
				filepath: filepath
			},
		});

		if (videoExist.length == 0) {
			var video = await VideoFileTbl.create({
				filepath: filepath,
				zip_filepath: null,
				date: new Date(),
				status: 'uploaddone',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			if (video) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["filepath"] = filepath;

		collectErrorLog(path.basename(__filename), "UpdateVideoInTbl", err, combine_return_variable, "");

		return false;
	}
};


exports.UpdateVideoUrlInAnalysis = async (analysis_id, cut_analysis_video) => {
	try {
		var analysis = await db.Analysis.update({
			video_url: cut_analysis_video
		}, {
			where: {
				id: analysis_id
			}
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["analysis_id"] = analysis_id;
		combine_return_variable["cut_analysis_video"] = cut_analysis_video;

		collectErrorLog(path.basename(__filename), "UpdateVideoUrlInAnalysis", err, combine_return_variable, "");

		return false;
	}
};


exports.UploadAWSCutVideo = async (s3UploadPath, extractedPath, fileName) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fileContent = fs.readFileSync(extractedPath + '/' + fileName);

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: s3UploadPath + fileName,
			Body: fileContent,
		};

		await s3.upload(params, async function (err, data) {
			if (err) {
				res
					.status(400)
					.json({ error: err, file: s3UploadPath, status: false });
			}
		});
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["s3UploadPath"] = s3UploadPath;
		combine_return_variable["extractedPath"] = extractedPath;
		combine_return_variable["fileName"] = fileName;

		collectErrorLog(path.basename(__filename), "UploadAWSCutVideo", err, combine_return_variable, "");

		return false;
	}
};


exports.GetLiveStreamingVideos = async (req, res) => {
	try {
		const analysisMasterId = req.body.analysis_master_id;
		var allMatchVideos = await db.LiveStreamingTbl.findAll({
			attributes: [
				[Sequelize.literal('DISTINCT(`asset_id`)'), 'asset_id'],
				'video_file_name',
				'analysis_master_id',
				'live_playback_id',
				'live_stream_key',
				'aws_server_path',
				'is_available_aws',
				'mux_file_path'
			],
			where: {
				analysis_master_id: req.body.analysis_master_id
			}
		});
		return res.status(200).json({ data: allMatchVideos, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetLiveStreamingVideos", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetCropLiveAnalysisDetail = async (req, res) => {
	try {
		if (req.body.analysis_master_id != "") {
			if (req.body.analysis_master_id != undefined) {
				var analysis_master = await db.AnalysisMaster.findAll({
					where: {
						id: req.body.analysis_master_id
					}
				});
				if (analysis_master.length > 0) {
					let analysis_master_id = req.body.analysis_master_id;
					const tournament = await this.Tournaments(analysis_master[0].tournament_id);
					let tournament_name = tournament ? tournament.name : "";
					const match = await this.Matches(analysis_master[0].match_id);
					let match_name = match ? match.name : "";
					let match_date = match ? match.date : "";
					const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
					let team_bat1 = battingTeam1 ? battingTeam1.name : "";
					const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
					let team_bat2 = battingTeam2 ? battingTeam2.name : "";
					const Camera1UserName = await this.UserDetail(analysis_master[0].Camera1User);
					let Camera1UserFullName = Camera1UserName ? Camera1UserName.full_name : "";
					const Camera2UserName = await this.UserDetail(analysis_master[0].Camera2User);
					let Camera2UserFullName = Camera2UserName ? Camera2UserName.full_name : "";
					let full_tournament_name;

					if (analysis_master[0].current_inning == 1) {
						full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date;
					} else {
						full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date;
					}

					analysis_master[0].dataValues.tournament_name = tournament_name;
					analysis_master[0].dataValues.match_name = match_name;
					analysis_master[0].dataValues.match_date = match_date;
					analysis_master[0].dataValues.team_bat1 = team_bat1;
					analysis_master[0].dataValues.team_bat2 = team_bat2;
					analysis_master[0].dataValues.full_tournament_name = full_tournament_name;
					analysis_master[0].dataValues.Camera1UserName = Camera1UserFullName;
					analysis_master[0].dataValues.Camera2UserName = Camera2UserFullName;
				}
				return res.status(200).json({ AnalysisMasterDetail: analysis_master, success: "1", "msg": "0" });
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetCropLiveAnalysisDetail", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetCropAnalysisDetail = async (req, res) => {
	try {
		if (req.body.analysis_master_id != "") {
			if (req.body.analysis_master_id != undefined) {
				var analysis_data = await db.Analysis.findAll({
					where: {
						analysis_master_id: req.body.analysis_master_id
					}
				});
				return res.status(200).json({ analysis_data: analysis_data, success: "1", "msg": "0" });
			} else {
				return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
			}
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetCropAnalysisDetail", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetMuxStatusFromAsset = async (req, res) => {
	try {
		let self = this;
		let increment_num = 0;

		if (req.params.asset_id != "") {
			if (req.params.asset_id != undefined) {
				let asset_id = req.params.asset_id;

				const encoded = Buffer.from(process.env.MUX_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64');

				fetch('https://api.mux.com/video/v1/assets/' + asset_id, {
					method: "GET",
					//body: {},
					headers: {
						"Content-type": "application/json; charset=UTF-8",
						'Authorization': 'Basic ' + encoded,
					},
				}).then((response) => {
					response.json();
				}).then((json) => {
					return res.status(200).json({ asset_data: json, success: "1", "msg": "0" });
				}).catch((err) => console.log(err));
			} else {
				return res.status(200).json({ asset_data: [], success: "0", "msg": "0" });
			}
		} else {
			return res.status(200).json({ asset_data: [], success: "0", "msg": "0" });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetMuxStatusFromAsset", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.CreateLiveStream = async (req, res) => {
	try {
		const encoded = Buffer.from(process.env.MUX_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64');

		fetch('https://api.mux.com/video/v1/live-streams', {
			method: "POST",
			body: JSON.stringify({
				latency_mode: "reduced",
				// "reconnect_window": 60,
				playback_policy: ["public"],
				new_asset_settings: {
					playback_policy: ["public"],
					mp4_support: "standard",
				},
			}),
			headers: {
				"Content-type": "application/json",
				"Authorization": "Basic " + encoded,
				"Access-Control-Allow-Origin": "*",
			},
		}).then((response) => {
			response.json();
		}).then((json) => {
			return res.status(200).json({ live_streaming: json, success: "1", status: true });
		}).catch((err) => {
			return res.status(400).json({ live_streaming: json, success: "0", status: false });
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "CreateLiveStream", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetLiveStreamDetails = async (req, res) => {
	try {
		if (req.params.streamId != "") {
			const encoded = Buffer.from(process.env.MUX_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64');

			fetch('https://api.mux.com/video/v1/live-streams/' + req.params.streamId, {
				method: "GET",
				// body: {},
				headers: {
					"Content-type": "application/json; charset=UTF-8",
					"Authorization": "Basic " + encoded,
					"Access-Control-Allow-Origin": "*",
				},
			}).then((response) => {
				response.json();
			}).then((json) => {
				return res.status(200).json({ live_streaming_details: json, success: "1", status: true });
			}).catch((err) => {
				return res.status(400).json({ live_streaming_details: json, success: "0", status: false });
			});
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetLiveStreamDetails", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.FinishLiveStream = async (req, res) => {
	try {
		if (req.params.streamId != "") {
			const encoded = Buffer.from(process.env.MUX_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64');

			fetch('https://api.mux.com/video/v1/live-streams/' + req.params.streamId + '/complete', {
				method: "PUT",
				// body: {},
				headers: {
					"Content-type": "application/json; charset=UTF-8",
					"Authorization": "Basic " + encoded,
					"Access-Control-Allow-Origin": "*",
				},
			}).then((response) => {
				response.json();
			}).then((json) => {
				return res.status(200).json({ finish_live_stream: json, success: "1", status: true });
			}).catch((err) => {
				return res.status(400).json({ finish_live_stream: json, success: "0", status: false });
			});
		} else {
			return res.status(200).json({ msg: "Invalid Data", log: req.body, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "FinishLiveStream", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DeleteAllLiveStream = async (req, res) => {
	const encoded = Buffer.from(process.env.MUX_TOKEN_ID + ':' + process.env.MUX_SECRET_KEY).toString('base64');

	fetch('https://api.mux.com/video/v1/live-streams/', {
		method: "GET",
		// body: {},
		headers: {
			"Content-type": "application/json; charset=UTF-8",
			"Authorization": "Basic " + encoded,
			"Access-Control-Allow-Origin": "*",
		},
	}).then((response) => {
		response.json();
	}).then((json) => {
		for (let i = 0; i < json.data.length; i++) {
			fetch('https://api.mux.com/video/v1/live-streams/' + json.data[i]["id"], {
				method: "DELETE",
				// body: {},
				headers: {
					"Content-type": "application/json; charset=UTF-8",
					"Authorization": "Basic " + encoded,
					"Access-Control-Allow-Origin": "*",
				},
			});
		}
		return res.status(200).json({ msg: "Live Steam Delete Successfully", success: "1", status: true });
	}).catch((err) => {
		collectErrorLog(path.basename(__filename), "DeleteAllLiveStream", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	});
};


exports.addWatermark = async (req, res) => {
	try {
		const axios = require('axios');
		const parsedUrl = new URL(decodeURIComponent(req.body.video_url));
		// Extract the file name from the pathname property
		const fileName = path.basename(parsedUrl.pathname);
		// const response = await axios.get(req.body.video_url, { responseType: 'stream' });
		// Define the public folder path and the full destination path
		const publicFolderPath = path.join(__dirname, '..', 'public');
		const matchVideoFolderPath = path.join(publicFolderPath, 'match_video');
		const destinationPath = path.join(matchVideoFolderPath, decodeURIComponent(fileName));
		axios({
			method: 'get',
			url: decodeURIComponent(req.body.video_url),
			responseType: 'stream',
		}).then((response) => {
			const writer = fs.createWriteStream(destinationPath);
			response.data.pipe(writer);
			writer.on('finish', () => {
				// console.log('Video downloaded successfully.');
				const inputPath = 'public/match_video/' + decodeURIComponent(fileName);
				const outputPath = 'public/watermark_video/' + decodeURIComponent(fileName);
				const watermarkPath = 'public/image/watermark.png';
				var ffmpeg = require('fluent-ffmpeg');
				ffmpeg(inputPath)
					.input(watermarkPath)
					.complexFilter([{
						filter: 'overlay',
						options: {
							x: 'main_w-overlay_w-10',
							y: '10'
						}
					}])
					.on('progress', function (progress) {
						console.log('Processing: ' + progress.percent + '% done');
					})
					.on('end', function () {
						// console.log('Finished');
						AWS.config.update({
							region: process.env.S3_REGION,
							accessKeyId: process.env.AWS_ACCESS_KEY,
							secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
						});
						const s3 = new AWS.S3();
						const fileContent = fs.readFileSync(outputPath);
						const params = {
							Bucket: process.env.AWS_BUCKET_NAME,
							Key: "well_played_tournament/" + decodeURIComponent(fileName),
							Body: fileContent,
						};
						s3.upload(params, async function (err, data) {
							if (err) {
								console.log("err ===========>" + err);
							} else {
								return res.status(200).json({
									msg: "Watermark Added Successfully",
									file: data.Location,
									success: "1",
									status: true,
								});
							}
						});
					})
					.on('error', function () {
						return res.status(200).json({ msg: "Watermark Added Successfully", success: "2", status: true });
					})
					.save(outputPath);
			});
			writer.on('error', (error) => {
				console.error('Error writing video:', error);
			});
		}).catch((error) => {
			console.error('Error downloading video:', error);
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "addWatermark", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.ReduceZipFileCompression = async (req, res) => {
	try {
		const inputPath = 'public/match_video/well_played_tournament1680359240602IPL_Match 3_NCA -U19A_2022-12-21_Over_FI_1.5.mp4';
	} catch (err) {
		collectErrorLog(path.basename(__filename), "ReduceZipFileCompression", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DemoUnzipper = async (req, res) => {
	try {
		const fs = require('fs');
		const unzipper = require('unzipper');
		// Open the zip file as a readable stream
		const readStream = fs.createReadStream('public/video_zip/Sample-TAR-File-for-Testing.tar');
		// Pipe the read stream to the unzipper parse method to get a stream of entries
		readStream.pipe(unzipper.Parse())
			.on('entry', function (entry) {
				const fileName = entry.path;
				const type = entry.type;
				if (type === 'Directory') {
					// If the entry is a directory, create it
					fs.mkdirSync(fileName);
				} else {
					// If the entry is a file, extract it
					entry.pipe(fs.createWriteStream(fileName));
				}
			})
			.on('close', function () {
				console.log('Finished extracting the zip file.');
			});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "DemoUnzipper", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UnZipVideoFromFileName = async (req, res) => {
	try {
		var allVideoFileTbl = await VideoFileTbl.findAll({
			where: {
				//filepath: null,
				//zip_filepath: { [Op.not]: '' },
				zip_filepath: {
					[Op.like]: req.body.fileName + '%'
				},
				status: 'uploaddone'
			}
		});

		let uploadedFileName = "";
		let final_filename = "";

		if (allVideoFileTbl.length > 0) {
			let video_filepath = allVideoFileTbl[0]["filepath"];

			if (video_filepath == null) {
				uploadedFileName = await this.UnzipMatchVideosFromZip(allVideoFileTbl[0]["zip_filepath"]);
				let updateFilenameInVideoFileTbl = await this.updateFilenameInVideoFileTbl(allVideoFileTbl[0]["fileid"], uploadedFileName);
			} else {
				uploadedFileName = video_filepath;
			}

			final_filename = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + uploadedFileName;
		}

		return res.status(200).json({
			success: "success",
			"msg": "File unzipped successfully",
			"final_filename": final_filename,
			"unzip_ball": req.body.unzip_ball,
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UnZipVideoFromFileName", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.getPostMessageVideo = async (req, res) => {
	try {
		const postMessageVideo = await PostMessageVideo.findAll({});
		if (postMessageVideo) {
			return res.status(200).json({ postMessageVideo: postMessageVideo, status: true });
		} else {
			return res.status(400).json({ error: error, status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "getPostMessageVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.SendPushNotification = async (type, senderId, senderName, receiverId, receiverName, fcm_id, image, urlId) => {
	// firebase cloud messaging server key
	const api_key = process.env.FCM_TOKEN;

	const messageTitle = 'Feedback';
	let message = 'Hope you are enjoying Well Played. Share your feedback with us!';

	// Map the notification type to the appropriate message
	if (type === 'follow') {
		messageTitle = 'You got followers!';
		message = `${senderName} is now following you on Well Played`;
	} else if (type === 'videorequest') {
		messageTitle = 'New video request';
		message = `${senderName} has sent you a video request`;
	} else if (type === 'videorequestassignment') {
		messageTitle = 'New video request';
		message = `${senderName} has assigned you a video request`;
	} else if (type === 'videorequestreply') {
		messageTitle = 'You have got feedback!';
		message = `${senderName} has reverted on your video request`;
	} else if (type === 'videolike') {
		messageTitle = 'You have got a like!';
		message = `${senderName} has liked your video`;
	} else if (type === 'taskassigned') {
		messageTitle = 'You have got a task!';
		message = `${senderName} has assigned you a task`;
	} else if (type === 'newtaskplanner') {
		messageTitle = 'You have got a new task planner!';
		message = `${senderName} has assigned you a task planner`;
	}

	image = image.replace('https', 'http');
	if (image === null) image = 'https://dev.wellplayed.in/public/noimg.png';

	try {
		// Save the push notification details in the database
		await PushNotification.create({
			title: messageTitle,
			message: message,
			fromId: senderId,
			toId: receiverId,
			urlId: 0,
			type: "",
			image: "",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Send the push notification to Firebase Cloud Messaging
		fetch('https://fcm.googleapis.com/fcm/send', {
			method: "POST",
			body: {
				to: fcm_id,
				collapse_key: 'type_a',
				data: {
					content: {
						id: 100,
						channelKey: 'general_notification',
						title: messageTitle,
						body: message,
						notificationLayout: 'Default',
					},
				},
			},
			headers: {
				Authorization: `key=${api_key}`,
				'Content-Type': 'application/json',
			},
		}).then((response) => response.json())
			.then((json) => {
				console.log('FCM Response:', json.data);
			}).catch((err) => console.log(err));
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["type"] = type;
		combine_return_variable["senderId"] = senderId;
		combine_return_variable["senderName"] = senderName;
		combine_return_variable["receiverId"] = receiverId;
		combine_return_variable["receiverName"] = receiverName;
		combine_return_variable["fcm_id"] = fcm_id;
		combine_return_variable["image"] = image;
		combine_return_variable["urlId"] = urlId;

		collectErrorLog(path.basename(__filename), "SendPushNotification", err, combine_return_variable, "");

		return false;
	}
};


exports.UploadAddVideoRequestInLocal = async (req, res, next) => {
	try {
		if (req.files != null) {
			let uploadPath = process.cwd() + '/public/practice_video/' + req.files.file.name;
			let newUploadPath = 'public/practice_video/' + req.files.file.name;
			await req.files.file.mv(uploadPath, function (err) {
				if (err) {
					//logger.info("Error");
				} else {
					var selected_attachment_data = {
						file_name: req.files.file.name,
						fullpath: newUploadPath,
						status: 1
					}
					req.selected_attachment_data = selected_attachment_data;
					next();
				}
			});
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadAddVideoRequestInLocal", err, req.body, "");
		next();
	}
};


exports.UploadAddVideoRequest = async (req, res, next) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();
		const fileContent = fs.readFileSync(req.selected_attachment_data.fullpath);
		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: "well_played_tournament/practice_video/" +
				req.selected_attachment_data.file_name,
			Body: fileContent,
		};
		s3.upload(params, async function (err, data) {
			if (err) {
				res
					.status(400)
					.json({ error: err, file: req.uploadedFile, status: false });
			}
			req.uploadedFile = data;
			next();
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadAddVideoRequest", err, req.body, "");
		next();
	}
};


exports.AddVideoRequest = async (req, res) => {
	try {
		const addRequest = await AppUserNotification.create({
			player_name: req.body.user_id,
			coach_name: req.body.coach_id,
			category: req.body.category,
			sub_category: req.body.sub_category,
			sub_sub_category: req.body.sub_sub_category,
			query_player: req.body.query_player,
			video_access: req.body.video_access,
			video_link: req.body.videoLink,
			image: req.body.videoImage,
			date_time: new Date(),
			status: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		if (addRequest) {
			const m_id = addRequest.id;

			if (req.body.user_id != req.body.coach_id) {
				const senderId = req.body.user_id;
				const receiverId = req.body.coach_id;

				if (req.body.assignment == 1) {
					senderId = req.body.coach_id;
					receiverId = req.body.user_id;
				}

				const receiverData = await AppUser.findByPk(receiverId);
				const receiverName = receiverData.full_name;
				const fcm_id = receiverData.fcm_id;

				const senderData = await AppUser.findByPk(senderId);
				const senderName = senderData.full_name;

				const image = await AppUserNotification.findByPk(m_id).image;

				this.sendPushNotification('videorequest', senderId, senderName, receiverId, receiverName, fcm_id, image, m_id);
			};

			return res.status(400).json({ data: addRequest, status: true });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddVideoRequest", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.ExternalCropAndTagAllLiveVideo = async (req, res) => {
	try {
		let self = this;
		// let increment_num = 0;

		if (req.params.analysis_master_id != "") {
			if (req.params.analysis_master_id != undefined) {

				var analysis_data = await db.Analysis.findAll({
					where: {
						analysis_master_id: req.params.analysis_master_id,
						start_time: {
							[Op.not]: null
						},
						end_interval: {
							[Op.not]: null
						},
						[Op.or]: [
							{ video_url: "" },
							{ video_url: null }
						]
					},
					//limit: 1
				});

				let total_analysis_data = 0;
				total_analysis_data = analysis_data.length;

				let increment_analysis = 0;
				if (analysis_data.length > 0) {
					for (var i = 0; i < analysis_data.length; i++) {
						var analysis_master = await db.AnalysisMaster.findAll({
							where: {
								id: analysis_data[i].analysis_master_id
							}
						});

						let full_tournament_name;
						let full_video_name;
						if (analysis_master.length > 0) {
							let analysis_master_id = analysis_data[i].analysis_master_id;
							const tournament = await this.Tournaments(analysis_master[0].tournament_id);
							let tournament_name = tournament ? tournament.name : "";

							const match = await this.Matches(analysis_master[0].match_id);
							let match_name = match ? match.name : "";
							let match_date = match ? match.date : "";

							const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
							let team_bat1 = battingTeam1 ? battingTeam1.name : "";

							const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
							let team_bat2 = battingTeam2 ? battingTeam2.name : "";

							let new_over = Math.ceil(analysis_data[i].current_ball);
							if (analysis_data[i].current_inning == 1) {
								full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI_' + new_over;
								full_video_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI_' + analysis_data[i].current_ball;
							} else {
								full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI_' + new_over;
								full_video_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI_' + analysis_data[i].current_ball;
							}

							let external_video_detail = await this.getExternalVideoDetail(analysis_master_id, analysis_data[i].current_ball, analysis_data[i].current_inning);

							if (external_video_detail.length > 0) {
								if ((external_video_detail[0].dataValues.external_cut_video_url != '') && (external_video_detail[0].dataValues.external_cut_video_url != null)) {
									const fileUrl = external_video_detail[0].dataValues.external_cut_video_url;
									let adjust_time = external_video_detail[0].dataValues.adjust_time;

									const fileName = 'public/aws_mux_download_video/' + full_video_name; // replace with your desired file name

									const file = fs.createWriteStream(fileName);
									const request = https.get(fileUrl, function (response) {
										response.pipe(file);
									});

									request.on('error', function (err) {
										//console.error("requestrequest_error", err);
									});

									let cut_file_name = full_video_name + '.mp4';
									let start_time = analysis_data[i].start_time;
									let end_interval = analysis_data[i].end_interval;
									let analysis_id = analysis_data[i].id;

									let time1 = moment.duration(start_time);
									let time2 = moment.duration(adjust_time);

									let result_time = moment.utc(time1.subtract(time2).asMilliseconds()).format('HH:mm:ss');

									file.on('finish', async function () {
										file.close();

										const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
										var ffmpeg = require('fluent-ffmpeg');
										ffmpeg.setFfmpegPath(ffmpegPath);

										ffmpeg(fileName)
											.setStartTime(result_time)
											.setDuration(end_interval)
											.output('public/mux_cut_video/' + cut_file_name)
											.on('end', async function (err) {
												if (!err) {
													// console.log('successfully converted');
													const s3UploadPath = 'well_played_tournament/';
													const extractedPath = 'public/mux_cut_video';
													const fileName = cut_file_name;
													await self.UploadAWSCutVideo(s3UploadPath, extractedPath, fileName);
													// console.log('Uploaded AWS successfully converted');
													const cut_analysis_video = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + cut_file_name;
													await self.UpdateVideoUrlInAnalysis(analysis_id, cut_analysis_video)
													// console.log('Update in database successfully', cut_analysis_video);

													await self.UpdateVideoInTbl(cut_file_name);

													increment_analysis++;

													if (total_analysis_data == increment_analysis) {
														return res.status(200).json({ analysis_data: analysis_data, success: "0", "msg": "0" });
													}
												}
											})
											.on('error', function (err) {
												console.log('conversion error: ', err);
											}).run();
									});
								} else {
									increment_analysis++;

									if (total_analysis_data == increment_analysis) {
										return res.status(200).json({ analysis_data: analysis_data, success: "0", "msg": "0" });
									}
								}
							} else {
								increment_analysis++;

								if (total_analysis_data == increment_analysis) {
									return res.status(200).json({ analysis_data: analysis_data, success: "0", "msg": "0" });
								}
							}
						}
					}
				} else {
					return res.status(200).json({ analysis_data: analysis_data, success: "0", "msg": "0" });
				}
			} else {
				return res.status(200).json({ live_streaming: [], success: "0", "msg": "0" });
			}
		} else {
			return res.status(200).json({ live_streaming: [], success: "0", "msg": "0" });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "ExternalCropAndTagAllLiveVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.getExternalVideoDetail = async (analysis_master_id, current_ball, current_inning, res) => {
	try {
		let analysis_external_cut_video = await AnalysisExternalCutVideo.findAll({
			where: {
				analysis_master_id: analysis_master_id,
				inning: current_inning,
				over_start: {
					[Op.lte]: parseFloat(current_ball)
				},
				over_end: {
					[Op.gte]: parseFloat(current_ball)
				}
			},
			order: [
				["id", "DESC"]
			]
		})
		return analysis_external_cut_video;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["analysis_master_id"] = analysis_master_id;
		combine_return_variable["current_ball"] = current_ball;
		combine_return_variable["current_inning"] = current_inning;

		collectErrorLog(path.basename(__filename), "getExternalVideoDetail", err, combine_return_variable, "");

		return false;
	}
};


exports.ExternalVideoDetail = async (req, res) => {
	try {
		const analysis_external_cut_video = await AnalysisExternalCutVideo.findAll({
			where: {
				analysis_master_id: req.body.analysis_master_id
			},
			order: [
				["id", "DESC"]
			]
		});
		return res.status(200).json({ data: analysis_external_cut_video, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "ExternalVideoDetail", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UploadFileExternalVideo = async (req, res, next) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		if (req.files == null) {
			next();
		} else {
			const fileContent = Buffer.from(req.files.file.data, "binary");
			const params = {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: "well_played_tournament/" +
					Date.now().toString() +
					req.files.file.name,
				Body: fileContent,
			};

			s3.upload(params, async function (err, data) {
				if (err) {
					res
						.status(400)
						.json({ error: err, file: req.uploadedFile, status: false });
				}
				req.uploadedFile = data;
				next();
			});
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadFileExternalVideo", err, req.body, "");
		next();
	}
};


exports.AddNewExternalVideo = async (req, res) => {
	let file_detail = "";

	if (typeof req.uploadedFile === "undefined") {
		file_detail = null;
	} else {
		file_detail = req.uploadedFile.Location ? req.uploadedFile.Location : null;
	}

	try {
		const addExternalVideo = await AnalysisExternalCutVideo.create({
			external_cut_video_url: file_detail,
			inning: req.body.inning,
			over_start: req.body.over_start,
			over_end: req.body.over_end,
			adjust_time: req.body.adjustment_time,
			analysis_master_id: req.body.analysis_master_id,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		if (addExternalVideo) {
			return res.status(200).json({ querydata: addExternalVideo, msg: "External video added successfully", status: true });
		} else {
			return res.status(404).json({
				msg: "Something went wrong. Please try again.",
				log: addExternalVideo,
				status: false,
			});
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddNewExternalVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UpdateExternalVideo = async (req, res) => {
	const videoId = req.body.id;

	// Check if the video with the given ID exists
	const existingVideo = await AnalysisExternalCutVideo.findByPk(videoId);
	if (!existingVideo) {
		return res.status(404).json({ msg: "Video not found", status: false });
	}

	// Get the file URL and other details from the request
	let file_detail = existingVideo.external_cut_video_url; // Set the default value to the existing URL
	if (req.uploadedFile && req.uploadedFile.Location) {
		file_detail = req.uploadedFile.Location; // Update with the new URL if provided
	}

	try {
		// Update the video record with the new data
		const updatedVideo = await existingVideo.update({
			external_cut_video_url: file_detail,
			inning: req.body.inning,
			over_start: req.body.over_start,
			over_end: req.body.over_end,
			adjust_time: req.body.adjustment_time,
			updatedAt: new Date(),
		});

		if (updatedVideo) {
			return res.status(200).json({ querydata: updatedVideo, msg: "Video updated successfully", status: true });
		} else {
			return res.status(500).json({ msg: "Something went wrong while updating the video", status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UpdateExternalVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.ExternalVideoDetailByID = async (req, res) => {
	try {
		const analysis_external_cut_video = await AnalysisExternalCutVideo.findAll({
			where: {
				id: req.body.id
			},
			order: [
				["id", "DESC"]
			]
		})
		return res.status(200).json({ data: analysis_external_cut_video, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "ExternalVideoDetailByID", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.getGoogleEventList = async (req, res) => {
	try {
		const axios = require('axios');
		const cheerio = require('cheerio');

		const searchQuery = 'health event in India';
		const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
		const response = await axios.get(searchUrl);

		const $ = cheerio.load(response.data);

		const eventList = [];

		$('div.g').each((index, element) => {
			const title = $(element).find('h3').text();
			const link = $(element).find('a').attr('href');
			const description = $(element).find('span.st').text();

			eventList.push({ title, link, description });
		});

		return res.status(200).json({ data: eventList, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "getGoogleEventList", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


async function fetchRssFeed() {
	const fetch = require('node-fetch');
	const parseString = require('xml2js').parseString;

	const rssFeedUrl = 'https://indiabioscience.org/feed';

	try {
		const response = await fetch(rssFeedUrl);
		const xmlData = await response.text();

		return new Promise((resolve, reject) => {
			parseString(xmlData, (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "fetchRssFeed", err, req.body, "");

		throw err;
	}
};


exports.getJobList = async (req, res) => {
	try {
		fetchRssFeed()
			.then(feedData => {
				// Process and use the feed data
				//console.log('RSS Feed Data:', JSON.stringify(feedData, null, 2));
				return res.status(200).json({ data: feedData, status: true });
			})
			.catch(error => {
				console.error('Error fetching RSS feed:', error);
			});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "getJobList", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.getElectronVideoListToCrop = async (req, res) => {
	try {
		let self = this;
		// let increment_num = 0;

		let list_video = [];
		if (req.params.analysis_master_id != "") {
			if (req.params.analysis_master_id != undefined) {

				var analysis_data = await db.Analysis.findAll({
					where: {
						analysis_master_id: req.params.analysis_master_id,
						current_inning: req.params.current_inning,
						start_time: {
							[Op.not]: null
						},
						end_interval: {
							[Op.not]: null
						},
						[Op.or]: [
							{ video_url: "" },
							{ video_url: null }
						]
					},
					order: [
						["current_inning", "ASC"],
						["current_ball", "ASC"],
						["extra_ball_delivery_result", "DESC"]
					]
					//limit: 1
				});

				let total_analysis_data = 0;
				total_analysis_data = analysis_data.length;

				let increment_analysis = 0;

				if (analysis_data.length > 0) {
					for (var i = 0; i < analysis_data.length; i++) {
						var analysis_master = await db.AnalysisMaster.findAll({
							where: {
								id: analysis_data[i].analysis_master_id
							}
						});

						let full_tournament_name;
						let full_video_name;
						if (analysis_master.length > 0) {
							let video_detail = {};
							let analysis_master_id = analysis_data[i].analysis_master_id;
							let extra_ball_delivery_result = analysis_data[i].extra_ball_delivery_result;

							const tournament = await this.Tournaments(analysis_master[0].tournament_id);
							let tournament_name = tournament ? tournament.name : "";

							const match = await this.Matches(analysis_master[0].match_id);
							let match_name = match ? match.name : "";
							let match_date = match ? match.date : "";

							const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
							let team_bat1 = battingTeam1 ? battingTeam1.name : "";

							const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
							let team_bat2 = battingTeam2 ? battingTeam2.name : "";

							let new_over = Math.ceil(analysis_data[i].current_ball);
							if (analysis_data[i].current_inning == 1) {
								full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI_' + new_over;
								full_video_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI_' + analysis_data[i].current_ball;
							} else {
								full_tournament_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI_' + new_over;
								full_video_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI_' + analysis_data[i].current_ball;
							}

							//console.log("extra_ball_delivery_result___",extra_ball_delivery_result)
							if ((extra_ball_delivery_result != "") && (extra_ball_delivery_result != null)) {
								full_video_name = full_video_name + '_' + extra_ball_delivery_result + '_' + analysis_data[i].id;
							}

							//console.log("analysis_data[i].current_ball",full_tournament_name)
							video_detail["analysis_id"] = analysis_data[i].id;
							video_detail["analysis_master_id"] = analysis_master_id;
							video_detail["tournament_id"] = analysis_master[0].tournament_id;
							video_detail["tournament_name"] = tournament_name;
							video_detail["match_id"] = analysis_master[0].match_id;
							video_detail["match_name"] = match_name;
							video_detail["match_date"] = match_date;
							video_detail["bat1_id"] = analysis_master[0].bat1_id;
							video_detail["team_bat1_name"] = team_bat1;
							video_detail["bat2_id"] = analysis_master[0].bat2_id;
							video_detail["team_bat2_name"] = team_bat2;
							video_detail["over"] = new_over;
							video_detail["current_inning"] = analysis_data[i].current_inning;
							video_detail["full_video_name"] = full_video_name;
							video_detail["current_ball"] = analysis_data[i].current_ball;
							video_detail["start_time"] = analysis_data[i].start_time;
							video_detail["end_interval"] = analysis_data[i].end_interval;
							video_detail["extra_ball_delivery_result"] = extra_ball_delivery_result;

							list_video.push(video_detail);
						}
					}
				}
				return res.status(200).json({ list_video: list_video, success: "0", "msg": "0" });
			} else {
				return res.status(200).json({ list_video: list_video, success: "0", "msg": "0" });
			}
		} else {
			return res.status(200).json({ list_video: list_video, success: "0", "msg": "0" });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "getElectronVideoListToCrop", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.cropVideoInLocal = async (req, res) => {
	try {
		let self = this;
		var analysis_data = await db.Analysis.findOne({
			where: {
				id: req.body.analysis_id
			}
		});

		let adjust_time = req.body.crop_absolute_video_start_time;
		let cut_file_name = req.body.full_video_name + '.mp4';
		let start_time = analysis_data.dataValues.start_time;
		let end_interval = analysis_data.dataValues.end_interval;

		let time1 = moment.duration(start_time);
		let time2 = moment.duration(adjust_time);

		let result_time = moment.utc(time1.subtract(time2).asMilliseconds()).format('HH:mm:ss');

		const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

		return res.status(200).json({ video_crop_detail: req.body, success: "0", "msg": "0" });

	} catch (err) {
		collectErrorLog(path.basename(__filename), "cropVideoInLocal", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.updateVideoUrlInAnalysisElectron = async (req, res) => {
	try {
		var analysis = await db.Analysis.update({
			video_url: req.body.video_url
		}, {
			where: {
				id: req.body.analysis_id
			}
		});
		return res.status(200).json({ data: analysis, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "updateVideoUrlInAnalysisElectron", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.ExternalVideoDetailByCropVideo = async (req, res) => {
	const tournamentId = req.params.tournament_id; // Assuming the parameter name is "tournament_id"
	const matchId = req.params.match_id; // Assuming the parameter name is "match_id"
	if (tournamentId !== "" && tournamentId !== undefined) {
		try {
			const analysis_data = await db.Analysis.findAll({
				where: {
					tournament_id: tournamentId,
					match_id: matchId
				},
				order: [
					["current_inning", "ASC"],
					["current_ball", "ASC"],
					["extra_ball_delivery_result", "DESC"]
				]
			});
			return res.status(200).json({ analysis_data: analysis_data, success: "1", msg: "0" });
		} catch (err) {
			collectErrorLog(path.basename(__filename), "ExternalVideoDetailByCropVideo", err, req.body, "");

			return res.status(400).json({
				msg: "Something went wrong. Please try again.",
				status: false,
				error: err,
			});
		}
	} else {
		return res.status(200).json({ msg: "Invalid Data", log: req.params, status: false });
	}
};


exports.updateStartTimeInAnalysisElectron = async (req, res) => {
	try {
		var analysis = await db.Analysis.update({
			start_time: req.body.start_time
		}, {
			where: {
				id: req.body.analysis_id
			}
		});
		return res.status(200).json({ data: analysis, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "updateStartTimeInAnalysisElectron", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.updateEndIntervalInAnalysisElectron = async (req, res) => {
	try {
		var analysis = await db.Analysis.update({
			end_interval: req.body.end_interval
		}, {
			where: {
				id: req.body.analysis_id
			}
		});
		return res.status(200).json({ data: analysis, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "updateEndIntervalInAnalysisElectron", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.AddVideoForLoadTesting = async (req, res, next) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fileContent = Buffer.from(req.files.my_file.data, "binary");
		const params = {
			Bucket: "testing-wellplayed-application-load",
			Key: Date.now().toString() +
				req.files.my_file.name,
			Body: fileContent,
		};

		s3.upload(params, async function (err, data) {
			if (err) {
				return res.status(400).json({ error: err, file: params.Key, status: false });
			}

			return res.status(200).json({ data: params.Key, status: true });
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddVideoForLoadTesting", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetMatchHightlightsPlaylist = async (req, res) => {
	try {
		if (req.body.tournamentID != undefined && req.body.matchID != undefined && req.body.inning != undefined) {
			const videoList = await Analysis.findAll({
				attributes: ["id", "current_ball", "ball_delivery_result", "extra_ball_delivery_result", "current_inning", "video_url", "video_thumbnail_url"],
				where: {
					tournament_id: req.body.tournamentID,
					match_id: req.body.matchID,
					current_inning: req.body.inning,
				},
				order: [
					["current_ball", "ASC"],
					["extra_ball_delivery_result", "DESC"]
				],
			})

			// console.log("videoList:", videoList)
			if (videoList) {
				return res.status(200).json({ videoList: videoList, status: true });
			} else {
				return res.status(404).json({ msg: "Something went wrong. Video List is empty. Please try again.", log: videoList, status: false });
			}
		} else {
			return res.status(404).json({ msg: "Invalid IDs provided", log: req.body, status: false });
		}

	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetMatchHightlightsPlaylist", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DownloadVideoInZipFile = async (req, res) => {
	const archiver = require('archiver');
	try {
		const zip = archiver('zip');
		let ballDeliveryResult = [];
		let playerIdField = "";
		if (req.body.player_id === 'all') {
			if (req.body.download_type === '4,6') {
				ballDeliveryResult = [4, 6];
			} else if (req.body.download_type === 'wicket') {
				ballDeliveryResult = ['W'];
			}
		} else {
			if (req.body.download_type === '4,6') {
				ballDeliveryResult = [4, 6];
				playerIdField = 'bat_striker_id';
			} else if (req.body.download_type === 'wicket') {
				ballDeliveryResult = ['W'];
				playerIdField = 'bowler_id';
			}
		}
		const whereClause = {
			match_id: req.body.match_id,
			ball_delivery_result: {
				[Op.in]: ballDeliveryResult
			},
			current_inning: req.body.current_inning // Assuming current_inning is 1-based
		};
		if (req.body.player_id !== 'all') {
			whereClause[playerIdField] = req.body.player_id;
		}
		const analysedData = await Analysis.findAll({
			where: whereClause,
			attributes: ['id', 'video_url'],
		});
		const s3ObjectKeys = [];
		if (analysedData.length > 0) {
			for (var x = 0; x < analysedData.length; x++) {
				if ((analysedData[x]["video_url"] != "") && (analysedData[x]["video_url"] != null)) {
					let parsedUrl = new URL(analysedData[x]["video_url"]);
					let pathWithoutDomain = decodeURIComponent(parsedUrl.pathname.slice(1));
					s3ObjectKeys.push(pathWithoutDomain);
				}
			}
		}
		if (s3ObjectKeys.length > 0) {
			AWS.config.update({
				region: process.env.S3_REGION,
				accessKeyId: process.env.AWS_ACCESS_KEY,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
			});
			const s3 = new AWS.S3();
			for (const s3ObjectKey of s3ObjectKeys) {
				const params = {
					Bucket: 'wellplayeds3bucket1',
					Key: s3ObjectKey,
				};
				try {
					// Download the file from S3
					const response = await s3.getObject(params).promise();
					const fileContent = response.Body;
					// Append file to the zip
					zip.append(fileContent, { name: path.basename(s3ObjectKey) });
				} catch (error) {
					console.error(`Error generating pre-signed URL for ${s3ObjectKey}:`, error);
				}
			}
			zip.finalize();
			zip.pipe(res);
		} else {
			return res.status(204).end(); // Respond with "No Content" status
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "DownloadVideoInZipFile", err, req.body, "");
		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UploadMatchFileInLocal_Improved = async (req, res, next) => {
	try {
		if (req.files != null) {
			let uploadPath = process.cwd() + '/public/match_video/' + req.files.file.name;
			let newUploadPath = 'public/match_video/' + req.files.file.name;
			await req.files.file.mv(uploadPath, function (err) {
				if (err) {
					//logger.info("Error");
				} else {
					var selected_attachment_data = {
						file_name: req.files.file.name,
						fullpath: newUploadPath,
						status: "uploaddone"
					}
					req.selected_attachment_data = selected_attachment_data;
					next();
				}
			});
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadMatchFileInLocal_Improved", err, req.body, "");
		next();
	}
};


exports.UploadMatchFile_Improved = async (req, res, next) => {
	try {
		if (req.selected_attachment_data.status != 'uploadfailed') {
			AWS.config.update({
				region: process.env.S3_REGION,
				accessKeyId: process.env.AWS_ACCESS_KEY,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
			});
			const s3 = new AWS.S3();
			const fs_new = require('fs').promises;
			const fileContent = await fs_new.readFile(req.selected_attachment_data.fullpath);
			const params = {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: "well_played_tournament/video_zip/" + req.selected_attachment_data.file_name,
				Body: fileContent,
			};
			const data = await s3.upload(params).promise();
			req.uploadedFile = data;
			next();
		} else {
			next();
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadMatchFile_Improved", err, req.body, "");
		next();
	}
};


exports.refreshServerUsingShell = async (req, res) => {
	try {
		const { exec } = require('child_process');
		const scriptPath = 'testfile.sh';
		// console.log("refreshServerUsingShell", scriptPath);
		exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error executing the script: ${error.message}`);
				return;
			}

			// console.log(`Script output: ${stdout}`);
			if (stderr) {
				console.error(`Script errors: ${stderr}`);
			}
		});
		return res.status(200).json({ runner: req.body });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "refreshServerUsingShell", err, req.body, "");
		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.ZipFileUploadInAWSBucketDirect = async (req, res) => {
	try {

		const start_upload = await this.addVideoUploadingLog("Start - AWS", req.body);
		if (req.files != null) {
			AWS.config.update({
				region: process.env.S3_REGION,
				accessKeyId: process.env.AWS_ACCESS_KEY,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
			});
			const s3 = new AWS.S3();
			const fileContent = req.files.file.data;
			const params = {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: "well_played_tournament/video_zip/" + req.files.file.name,
				Body: fileContent,
			};
			// console.log("fileContent", fileContent);
			await s3.upload(params).promise().then(async (data) => {
				req.uploadedFile = data;
				var selected_attachment_data = {
					file_name: req.files.file.name,
					status: "uploaddone"
				}
				req.selected_attachment_data = selected_attachment_data;
				const uploaded_upload = await this.addVideoUploadingLog("Uploaded - AWS", req.body);
				await this.AddMatchVideo_Improved(req, res);
			})
				.catch(async err => {
					const failed_upload = await this.addVideoUploadingLog("Failed - AWS", req.body);
					//collectErrorLog(path.basename(__filename), "ZipFileUploadInAWSBucketDirect1", err, req.body, "");
					return res.status(400).json({
						msg: "Something went wrong. Please try again.",
						status: false,
						error: err,
						video_status: "uploadfailed"
					});
					// Handle the error here if needed
				});
		} else {
			collectErrorLog(path.basename(__filename), "ZipFileUploadInAWSBucketDirect", { "error": "Zip file is not received" }, req.body, "");
			var selected_attachment_data = {
				status: "uploadfailed"
			}
			req.selected_attachment_data = selected_attachment_data;
			return res.status(400).json({
				msg: "Zip file is not received",
				status: false,
				error: "",
				video_status: "uploadfailed"
			});
		}
	} catch (err) {
		const main_try_upload = await this.addVideoUploadingLog("Main Try Failed - AWS", req.body);
		collectErrorLog(path.basename(__filename), "ZipFileUploadInAWSBucketDirect2", err, req.body, "");
		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.AddMatchVideo_Improved = async (req, res) => {
	try {
		var video = await VideoFileTbl.update({
			status: req.selected_attachment_data.status,
		}, {
			where: {
				zip_filepath: req.body.zipFileName,
			},
		});
		if (video) {
			return res.status(200).json({ video: video, file: req.uploadedFile, status: true, video_status: req.selected_attachment_data.status });
		} else {
			return res.status(400).json({ msg: "Something went wrong. Please try again.", status: false, video_status: req.selected_attachment_data.status });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddMatchVideo_Improved", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.addVideoUploadingLog = async (upload_type, input_data) => {
	try {
		var video = await db.VideoUploadingTbl.create({
			upload_type: upload_type,
			input_data: JSON.stringify(input_data),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return true;
	} catch (err) {
		collectErrorLog(path.basename(__filename), "addVideoUploadingLog", err, req.body, "");

		return false;
	}
};

exports.UploadMatchFileInLocal = async (req, res, next) => {
	try {
		if (req.files != null) {
			let uploadPath = process.cwd() + '/public/match_video/' + req.files.file.name;
			let newUploadPath = 'public/match_video/' + req.files.file.name;
			await req.files.file.mv(uploadPath, function (err) {
				if (err) {
					collectErrorLog(path.basename(__filename), "UploadMatchFileInLocal + local", err, req.body, "");

					return res.status(400).json({ error: err, msg: "local Upload Failed.", status: false });
				} else {
					var selected_attachment_data = {
						file_name: req.files.file.name,
						fullpath: newUploadPath,
						status: "uploaddone"
					}
					req.selected_attachment_data = selected_attachment_data;
					next();
				}
			});
		} else {
			collectErrorLog(path.basename(__filename), "UploadMatchFileInLocal", { "error": "Zip file is not received" }, req.body, "");
			var selected_attachment_data = {
				status: "uploadfailed"
			}
			req.selected_attachment_data = selected_attachment_data;
			next();
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadMatchFileInLocal", err, req.body, "");
		next();
	}
};


exports.UploadMatchFile = async (req, res, next) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fileContent = fs.readFileSync(req.selected_attachment_data.fullpath);
		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: "well_played_tournament/video_zip/" + req.selected_attachment_data.file_name,
			Body: fileContent,
		};
		s3.upload(params, async function (err, data) {
			if (err) {
				collectErrorLog(path.basename(__filename), "UploadMatchFile + aws", err, req.body, "");

				return res.status(400).json({ error: err, file: req.uploadedFile, status: false });
			}
			req.uploadedFile = data;
			next();
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UploadMatchFile", err, req.body, "");
		next();
	}
};


exports.AddMatchVideo = async (req, res) => {
	try {
		var video = await VideoFileTbl.update({
			status: req.selected_attachment_data.status,
		}, {
			where: {
				zip_filepath: req.body.zipFileName,
			},
		});
		if (video) {
			return res.status(200).json({ video: video, file: req.uploadedFile, status: true, video_status: req.selected_attachment_data.status });
		} else {
			return res.status(400).json({ msg: "Something went wrong. Please try again.", status: false, video_status: req.selected_attachment_data.status });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "AddMatchVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UploadMatchFileInLocalIOS = async (req, res, next) => {
	if (req.files != null) {
		let uploadPath = process.cwd() + '/public/match_video/' + req.files.file.name;
		let newUploadPath = 'public/match_video/' + req.files.file.name;
		await req.files.file.mv(uploadPath, function (err) {
			if (err) {
				//logger.info("Error");
			} else {
				// console.log("uploadPath ==============> ", uploadPath);
				var selected_attachment_data = {
					file_name: req.files.file.name,
					fullpath: newUploadPath,
					status: "uploaddone"
				}
				req.selected_attachment_data = selected_attachment_data;
				next();
			}
		});
	}
};


exports.UploadMatchFileIOS = async (req, res, next) => {
	AWS.config.update({
		region: process.env.S3_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
	});
	const s3 = new AWS.S3();
	const fileContent = fs.readFileSync(req.selected_attachment_data.fullpath);
	const params = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: "well_played_tournament/video_zip/" +
			//"well_played_tournament/" +
			req.selected_attachment_data.file_name,
		Body: fileContent,
	};
	s3.upload(params, async function (err, data) {
		if (err) {
			return res.status(400).json({ error: err, file: req.uploadedFile, status: false });
		}
		req.uploadedFile = data;
		next();
	});
};


exports.AddMatchVideoIOS = async (req, res) => {
	var video = await VideoFileTbl.update({
		status: req.selected_attachment_data.status,
	}, {
		where: {
			zip_filepath: req.selected_attachment_data.file_name,
		},
	});
	if (video) {
		return res.status(200).json({ video: video, file: req.uploadedFile, status: true });
	} else {
		return res.status(404).json({ msg: "Something went wrong", log: video, status: false });
	}
};


exports.CronJobUnzippingTaggingVideo = async (req, res) => {
	try {
		var allVideoFileTbl = await VideoFileTbl.findAll({
			where: {
				filepath: null,
				status: 'uploaddone'
			},
			order: [
				["fileid", "DESC"]
			],
			limit: 5
		});

		let uploadedFileName = "";
		let final_filename = "";

		if (allVideoFileTbl.length > 0) {
			for (let i = 0; i < allVideoFileTbl.length; i++) {
				let video_filepath = allVideoFileTbl[i]["filepath"];
				if (video_filepath == null) {
					uploadedFileName = await this.UnzipMatchVideosFromZipCRON(allVideoFileTbl[i]["zip_filepath"]);
					let updateFilenameInVideoFileTbl = await this.updateFilenameInVideoFileTblCRON(allVideoFileTbl[i]["fileid"], uploadedFileName);
					// uploadedFileName = "Nilesh Tournament Match_Ball Restriction Testing_NCA -U19A_2024-02-06_Over_FI_1.1_559529.mp4";
					let tag_to_ball_using_filename = await this.tagToBallUsingFilenameCRON(uploadedFileName);

				}
			}
		}

		return res.status(200).json({
			success: "success",
			"msg": "File unzipped successfully",
			"allVideoFileTbl": allVideoFileTbl
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "CronJobUnzippingTaggingVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.tagToBallUsingFilenameCRON = async (uploadedFileName) => {
	try {
		let split_file_name = uploadedFileName.split('_');

		if (split_file_name.length == 7) {
			let Match_Name = split_file_name.length > 1 ? split_file_name[1] : "";
			let Inning_Name = split_file_name.length > 5 ? split_file_name[5] : "";
			let Over_Name = split_file_name.length > 6 ? split_file_name[6] : "";

			let match_id = "";
			if (Match_Name != "") {
				var match_exist = await db.Match.findOne({
					where: {
						name: Match_Name
					},
					attributes: ["id"]
				})
				if (match_exist) {
					match_id = match_exist.dataValues.id;
				}
			}

			let inning = "";
			if (Inning_Name === 'FI') {
				inning = 1;
			} else if (Inning_Name === 'SI') {
				inning = 2;
			}

			let floatOver = "";
			if (Over_Name != "") {
				floatOver = Over_Name.replace(/\.[^/.]+$/, "");
			}
			let analysis_id = "";
			if ((match_id != "") && (inning != "") && (floatOver != "")) {
				var analysis_exist = await db.Analysis.findOne({
					where: {
						match_id: match_id,
						current_ball: floatOver,
						current_inning: inning
					},
					attributes: ["id"]
				})
				if (analysis_exist) {
					analysis_id = analysis_exist.dataValues.id;
					const analysis_video = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + uploadedFileName;
					const thumbnail_fileName = `${uploadedFileName.slice(0, -4)}.png`;
					const analysis_thumbnail = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/video_thumbnails/" + thumbnail_fileName;
					await this.UpdateVideoUrlInAnalysisCRON(analysis_id, analysis_video)
					await this.UpdateThumbnailUrlInAnalysisCRON(analysis_id, analysis_thumbnail)
				}
			}
		} else if (split_file_name.length == 8) {
			let Match_Name = split_file_name.length > 1 ? split_file_name[1] : "";
			let Inning_Name = split_file_name.length > 5 ? split_file_name[5] : "";
			let Over_Name = split_file_name.length > 6 ? split_file_name[6] : "";
			let Six_Digit_Number_Name = split_file_name.length > 7 ? split_file_name[7] : "";

			let Six_Digit_Number = "";
			if (Six_Digit_Number_Name != "") {
				Six_Digit_Number = Six_Digit_Number_Name.replace(/\.[^/.]+$/, "");
			}

			let match_id = "";
			if (Match_Name != "") {
				var match_exist = await db.Match.findOne({
					where: {
						name: Match_Name
					},
					attributes: ["id"]
				})
				if (match_exist) {
					match_id = match_exist.dataValues.id;
				}
			}

			let inning = "";
			if (Inning_Name === 'FI') {
				inning = 1;
			} else if (Inning_Name === 'SI') {
				inning = 2;
			}

			let floatOver = "";
			if (Over_Name != "") {
				floatOver = Over_Name;
			}

			let analysis_id = "";
			if ((match_id != "") && (inning != "") && (floatOver != "") && (Six_Digit_Number != "")) {
				var analysis_exist = await db.Analysis.findOne({
					where: {
						match_id: match_id,
						current_ball: floatOver,
						current_inning: inning,
						sixDigitNumber: Six_Digit_Number
					},
					attributes: ["id"]
				})
				if (analysis_exist) {
					analysis_id = analysis_exist.dataValues.id;
					let analysis_video = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + uploadedFileName;
					const thumbnail_fileName = `${uploadedFileName.slice(0, -4)}.png`;
					let analysis_thumbnail = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/video_thumbnails/" + thumbnail_fileName;
					await this.UpdateVideoUrlInAnalysisCRON(analysis_id, analysis_video)
					await this.UpdateThumbnailUrlInAnalysisCRON(analysis_id, analysis_thumbnail)
					console.log('completed Thumbnail update in analysis table')
				}
			}
		}

		return true;
	} catch (err) {
		collectErrorLog(path.basename(__filename), "tagToBallUsingFilenameCRON", err, uploadedFileName, "");

		return true;
	}
}

exports.UpdateVideoUrlInAnalysisCRON = async (analysis_id, analysis_video) => {
	try {
		console.log(analysis_id, analysis_video)
		var analysis = await db.Analysis.update({
			video_url: analysis_video
		}, {
			where: {
				id: analysis_id
			}
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["analysis_id"] = analysis_id;
		combine_return_variable["analysis_video"] = analysis_video;

		collectErrorLog(path.basename(__filename), "UpdateVideoUrlInAnalysisCRON", err, combine_return_variable, "");

		return false;
	}
};


exports.UnzipMatchVideosFromZipCRON = async (zipName) => {
	const stream = require('stream');
	AWS.config.update({
		region: process.env.S3_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
	});
	const s3 = new AWS.S3();

	// Specify the S3 bucket name and key of the file to unzip
	const bucketName = process.env.AWS_BUCKET_NAME;
	//const zipName = 'Admin Match_Student 11 Vs Final 11_VNIT Team C_2023-04-07_Over_FI_0.1.zip';
	const fileNameWithoutExtension = zipName.split('.').slice(0, -1).join('.');

	const fileName = fileNameWithoutExtension + '.mp4';
	//console.log("fileName", fileName);
	const fileKey = 'well_played_tournament/video_zip/' + zipName;

	// Function to unzip a file in S3 bucket
	const unzipFileInS3BucketCRON = async (bucketName, fileKey) => {

		try {
			// Get the zipped file from S3
			const getObjectParams = {
				Bucket: bucketName,
				Key: fileKey
			};
			//console.log("getObjectParams", getObjectParams)
			const fileData = await s3.getObject(getObjectParams).promise();

			// Unzip the file using a library like 'adm-zip' or 'unzipper'
			// In this example, we'll use 'unzipper' library
			const Unzipper = require('unzipper');

			// Create a readable stream from the zipped file data
			const readableStream = new stream.PassThrough();
			readableStream.end(fileData.Body);

			// Unzip the file using 'unzipper' library
			const extractedPath = 'public/video_zip';
			await readableStream.pipe(Unzipper.Extract({ path: extractedPath })).promise();

			const s3UploadPath = 'well_played_tournament/';
			//step 2

			await this.UploadUnzipFileToServerCRON(s3UploadPath, extractedPath, fileName);
			console.log("Upload Process - 2")
			return fileName;

		} catch (err) {
			let combine_return_variable = {};
			combine_return_variable["zipName"] = zipName;

			collectErrorLog(path.basename(__filename), "UnzipMatchVideosFromZipCRON", err, combine_return_variable, "");

			return false
		}
	}

	// Call the function to unzip the file
	await unzipFileInS3BucketCRON(bucketName, fileKey)
		.then(() => {
			//console.log('File unzipped successfully');
		})
		.catch((err) => {
			//console.error('Error unzipping file:', err);
		});

	return fileName;
};



exports.UploadUnzipFileToServerCRON = async (s3UploadPath, extractedPath, fileName) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fs = require('fs');
		const util = require('util');
		const readFile = util.promisify(fs.readFile);
		const createReadStream = util.promisify(fs.createReadStream);

		const fileContent = await readFile(`${extractedPath}/${fileName}`);

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `${s3UploadPath}${fileName}`,
			Body: fileContent,
		};

		const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
		const ffmpeg = require('fluent-ffmpeg');
		ffmpeg.setFfmpegPath(ffmpegPath);
		const thumbnail_fileName = `${fileName.slice(0, -4)}.png`;

		const thumbnailPromise = new Promise((resolve, reject) => {
			ffmpeg(`./public/video_zip/${fileName}`)
				.on('end', async function (files) {
					console.log('screenshots were saved as ' + files);
					resolve();
				})
				.screenshots({
					timestamps: [0],
					filename: thumbnail_fileName,
					folder: './public/video_zip',
				})
				.on('error', function (err) {
					console.log('an error happened: ' + err.message);
					reject(err);
				});
		});

		await thumbnailPromise;

		const thumbnail_s3UploadPath = `video_thumbnails/`;

		const thumbnail_params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `${thumbnail_s3UploadPath}${thumbnail_fileName}`,
			Body: fs.createReadStream(`./public/video_zip/${thumbnail_fileName}`),
		};
		console.log('here');

		try {
			const thumbnail_data = await s3.upload(thumbnail_params).promise();
			console.log("S3 Thumbnail Upload Successful:", thumbnail_data);
		} catch (err) {
			console.error("Error during S3 Thumbnail Upload:", err);
			throw err; // Rethrow the error to handle it in the outer catch block
		}

		const data = await s3.upload(params).promise();
		console.log("S3 Main File Upload Successful:", data);

		fs.unlink(`./public/video_zip/${thumbnail_fileName}`, (err) => {
			console.log(err);
		})

		return { status: true, message: 'Upload successful' };
	} catch (err) {
		console.error("Error occurred during upload:", err);
		let combine_return_variable = {};
		combine_return_variable["s3UploadPath"] = s3UploadPath;
		combine_return_variable["extractedPath"] = extractedPath;
		combine_return_variable["fileName"] = fileName;

		collectErrorLog(path.basename(__filename), "UploadUnzipFileToServerCRON", err, combine_return_variable, "");

		return { status: false, message: 'Error occurred during upload' };
	}
};



exports.updateFilenameInVideoFileTblCRON = async (fileid, filepath) => {
	try {
		await VideoFileTbl.update({
			filepath: filepath
		}, {
			where: {
				fileid: fileid
			},
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["fileid"] = fileid;
		combine_return_variable["filepath"] = filepath;

		collectErrorLog(path.basename(__filename), "updateFilenameInVideoFileTblCRON", err, combine_return_variable, "");

		return false;
	}
};



exports.ManualJobUnzippingTaggingVideo = async (req, res) => {
	try {
		var analysis_master = await db.AnalysisMaster.findAll({
			where: {
				match_id: req.body.match_id
			}
		});
		const tournament = await this.Tournaments(analysis_master[0].tournament_id);
		let tournament_name = tournament ? tournament.name : "";

		const match = await this.Matches(analysis_master[0].match_id);
		let match_name = match ? match.name : "";
		let match_date = match ? match.date : "";

		const battingTeam1 = await this.firstBatTeam(analysis_master[0].bat1_id);
		let team_bat1 = battingTeam1 ? battingTeam1.name : "";

		const battingTeam2 = await this.firstBatTeam(analysis_master[0].bat2_id);
		let team_bat2 = battingTeam2 ? battingTeam2.name : "";

		let first_inning_ball_name = tournament_name + '_' + match_name + '_' + team_bat1 + '_' + match_date + '_Over_FI';

		let second_inning_ball_name = tournament_name + '_' + match_name + '_' + team_bat2 + '_' + match_date + '_Over_SI';

		// console.log("first_inning_ball_name", first_inning_ball_name);
		// console.log("second_inning_ball_name", second_inning_ball_name);

		var allVideoFileTbl = await VideoFileTbl.findAll({
			where: {
				filepath: null,
				status: 'uploaddone',
				[Op.or]: [{
					zip_filepath: {
						[Op.like]: first_inning_ball_name + '%'
					}
				},
				{
					zip_filepath: {
						[Op.like]: second_inning_ball_name + '%'
					}
				},
				]
			},
			order: [
				["fileid", "DESC"]
			],
			limit: 5
		});

		let uploadedFileName = "";
		let final_filename = "";
		console.log("allVideoFileTbl", allVideoFileTbl)
		if (allVideoFileTbl.length > 0) {
			for (let i = 0; i < allVideoFileTbl.length; i++) {
				let video_filepath = allVideoFileTbl[i]["filepath"];

				if (video_filepath == null) {
					uploadedFileName = await this.UnzipMatchVideosFromZipManual(allVideoFileTbl[i]["zip_filepath"]);
					let updateFilenameInVideoFileTbl = await this.updateFilenameInVideoFileTblManual(allVideoFileTbl[i]["fileid"], uploadedFileName);
					// uploadedFileName = "Nilesh Tournament Match_Ball Restriction Testing_NCA -U19A_2024-02-06_Over_FI_1.1_559529.mp4";
					let tag_to_ball_using_filename = await this.tagToBallUsingFilenameManual(uploadedFileName);

					allVideoFileTbl[i].dataValues["full_video_url"] = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + uploadedFileName;
				}
			}
		}

		return res.status(200).json({
			success: "success",
			"msg": "File unzipped successfully",
			"allVideoFileTbl": allVideoFileTbl
		});
	} catch (err) {
		collectErrorLog(path.basename(__filename), "ManualJobUnzippingTaggingVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.DownloadVideoInZipFileCount = async (req, res) => {
	try {
		let ballDeliveryResult = [];
		let playerIdField = "";
		if (req.body.player_id === 'all') {
			if (req.body.download_type === '4,6') {
				ballDeliveryResult = [4, 6];
			} else if (req.body.download_type === 'wicket') {
				ballDeliveryResult = ['W'];
			}
		} else {
			if (req.body.download_type === '4,6') {
				ballDeliveryResult = [4, 6];
				playerIdField = 'bat_striker_id';
			} else if (req.body.download_type === 'wicket') {
				ballDeliveryResult = ['W'];
				playerIdField = 'bowler_id';
			}
		}
		const whereClause = {
			match_id: req.body.match_id,
			ball_delivery_result: {
				[Op.in]: ballDeliveryResult
			},
			current_inning: req.body.current_inning // Assuming current_inning is 1-based
		};
		if (req.body.player_id !== 'all') {
			whereClause[playerIdField] = req.body.player_id;
		}
		const analysedData = await Analysis.findAll({
			where: whereClause,
			attributes: ['id', 'video_url'],
		});
		const videoCount = analysedData.length;
		return res.status(200).json({ videoCount }); // Return videoCount in the response
	} catch (err) {
		collectErrorLog(path.basename(__filename), "DownloadVideoInZipFileCount", err, req.body, "");
		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetVideouploadingTblError = async (req, res) => {
	try {
		let awsvideoerrorlogdata = {};
		// Extract limit, offset, and upload_type from the request body or use default values
		const { offset = 0, upload_type = "", search_text = "" } = req.body;
		const whereClause = upload_type ? { upload_type } : {}; // Use upload_type in where clause if provided
		if (search_text) {
			whereClause.input_data = {
				[Op.like]: `%${search_text}%`
			};
		}
		const videotbldata = await db.VideoUploadingTbl.findAll({
			where: whereClause,
			order: [
				["id", "DESC"]
			],
			limit: 100,
			offset,
		});
		awsvideoerrorlogdata["get_aws_error_log"] = videotbldata;
		return res.status(200).json({ querydata: awsvideoerrorlogdata, status: true });
	} catch (err) {
		this.collectErrorLog(path.basename(__filename), "GetVideouploadingTblError", err, req.body, "");
		return res.status(404).json({
			msg: "Something went wrong. Please try again.",
			status: false,
		});
	}
};


exports.UnzipMatchVideosFromZipManual = async (zipName) => {
	const stream = require('stream');
	AWS.config.update({
		region: process.env.S3_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
	});
	const s3 = new AWS.S3();

	// Specify the S3 bucket name and key of the file to unzip
	const bucketName = process.env.AWS_BUCKET_NAME;
	//const zipName = 'Admin Match_Student 11 Vs Final 11_VNIT Team C_2023-04-07_Over_FI_0.1.zip';
	const fileNameWithoutExtension = zipName.split('.').slice(0, -1).join('.');

	const fileName = fileNameWithoutExtension + '.mp4';
	//console.log("fileName", fileName);
	const fileKey = 'well_played_tournament/video_zip/' + zipName;

	// Function to unzip a file in S3 bucket
	const unzipFileInS3BucketManual = async (bucketName, fileKey) => {

		try {
			// Get the zipped file from S3
			const getObjectParams = {
				Bucket: bucketName,
				Key: fileKey
			};
			//console.log("getObjectParams", getObjectParams)
			const fileData = await s3.getObject(getObjectParams).promise();

			// Unzip the file using a library like 'adm-zip' or 'unzipper'
			// In this example, we'll use 'unzipper' library
			const Unzipper = require('unzipper');

			// Create a readable stream from the zipped file data
			const readableStream = new stream.PassThrough();
			readableStream.end(fileData.Body);

			// Unzip the file using 'unzipper' library
			const extractedPath = 'public/video_zip';
			await readableStream.pipe(Unzipper.Extract({ path: extractedPath })).promise();

			const s3UploadPath = 'well_played_tournament/';

			await this.UploadUnzipFileToServerManual(s3UploadPath, extractedPath, fileName);
			console.log("Upload Process - 2")
			return fileName;

		} catch (err) {
			let combine_return_variable = {};
			combine_return_variable["zipName"] = zipName;

			collectErrorLog(path.basename(__filename), "UnzipMatchVideosFromZipManual", err, combine_return_variable, "");

			return false
		}
	}

	// Call the function to unzip the file
	await unzipFileInS3BucketManual(bucketName, fileKey)
		.then(() => {
			//console.log('File unzipped successfully');
		})
		.catch((err) => {
			//console.error('Error unzipping file:', err);
		});

	return fileName;
};


exports.UploadUnzipFileToServerManual = async (s3UploadPath, extractedPath, fileName) => {
	try {
		AWS.config.update({
			region: process.env.S3_REGION,
			accessKeyId: process.env.AWS_ACCESS_KEY,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PROJECT,
		});
		const s3 = new AWS.S3();

		const fs_new = require('fs').promises;

		const fileContent = await fs_new.readFile(`${extractedPath}/${fileName}`);

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `${s3UploadPath}${fileName}`,
			Body: fileContent,
		};

		const data = await s3.upload(params).promise(); // Use .promise() to await the upload operation

		return { status: true, message: 'Upload successful' };
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["s3UploadPath"] = s3UploadPath;
		combine_return_variable["extractedPath"] = extractedPath;
		combine_return_variable["fileName"] = fileName;

		collectErrorLog(path.basename(__filename), "UploadUnzipFileToServerManual", err, combine_return_variable, "");

		return false;
	}
};

exports.updateFilenameInVideoFileTblManual = async (fileid, filepath) => {
	try {
		await VideoFileTbl.update({
			filepath: filepath
		}, {
			where: {
				fileid: fileid
			},
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["fileid"] = fileid;
		combine_return_variable["filepath"] = filepath;

		collectErrorLog(path.basename(__filename), "updateFilenameInVideoFileTblManual", err, combine_return_variable, "");

		return false;
	}
};

exports.tagToBallUsingFilenameManual = async (uploadedFileName) => {
	try {
		let split_file_name = uploadedFileName.split('_');

		if (split_file_name.length == 7) {
			let Match_Name = split_file_name.length > 1 ? split_file_name[1] : "";
			let Inning_Name = split_file_name.length > 5 ? split_file_name[5] : "";
			let Over_Name = split_file_name.length > 6 ? split_file_name[6] : "";

			let match_id = "";
			if (Match_Name != "") {
				var match_exist = await db.Match.findOne({
					where: {
						name: Match_Name
					},
					attributes: ["id"]
				})
				if (match_exist) {
					match_id = match_exist.dataValues.id;
				}
			}

			let inning = "";
			if (Inning_Name === 'FI') {
				inning = 1;
			} else if (Inning_Name === 'SI') {
				inning = 2;
			}

			let floatOver = "";
			if (Over_Name != "") {
				floatOver = Over_Name.replace(/\.[^/.]+$/, "");
			}
			let analysis_id = "";
			if ((match_id != "") && (inning != "") && (floatOver != "")) {
				var analysis_exist = await db.Analysis.findOne({
					where: {
						match_id: match_id,
						current_ball: floatOver,
						current_inning: inning
					},
					attributes: ["id"]
				})
				if (analysis_exist) {
					analysis_id = analysis_exist.dataValues.id;
					let analysis_video = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + uploadedFileName;
					await this.UpdateVideoUrlInAnalysisManual(analysis_id, analysis_video)
				}
			}
		} else if (split_file_name.length == 8) {
			let Match_Name = split_file_name.length > 1 ? split_file_name[1] : "";
			let Inning_Name = split_file_name.length > 5 ? split_file_name[5] : "";
			let Over_Name = split_file_name.length > 6 ? split_file_name[6] : "";
			let Six_Digit_Number_Name = split_file_name.length > 7 ? split_file_name[7] : "";

			let Six_Digit_Number = "";
			if (Six_Digit_Number_Name != "") {
				Six_Digit_Number = Six_Digit_Number_Name.replace(/\.[^/.]+$/, "");
			}

			let match_id = "";
			if (Match_Name != "") {
				var match_exist = await db.Match.findOne({
					where: {
						name: Match_Name
					},
					attributes: ["id"]
				})
				if (match_exist) {
					match_id = match_exist.dataValues.id;
				}
			}

			let inning = "";
			if (Inning_Name === 'FI') {
				inning = 1;
			} else if (Inning_Name === 'SI') {
				inning = 2;
			}

			let floatOver = "";
			if (Over_Name != "") {
				floatOver = Over_Name;
			}

			let analysis_id = "";
			if ((match_id != "") && (inning != "") && (floatOver != "") && (Six_Digit_Number != "")) {
				var analysis_exist = await db.Analysis.findOne({
					where: {
						match_id: match_id,
						current_ball: floatOver,
						current_inning: inning,
						sixDigitNumber: Six_Digit_Number
					},
					attributes: ["id"]
				})
				//reference
				if (analysis_exist) {
					analysis_id = analysis_exist.dataValues.id;
					let analysis_video = "https://wellplayeds3bucket1.s3.ap-south-1.amazonaws.com/well_played_tournament/" + uploadedFileName;
					await this.UpdateVideoUrlInAnalysisManual(analysis_id, analysis_video)
				}
			}
		}

		return true;
	} catch (err) {
		collectErrorLog(path.basename(__filename), "tagToBallUsingFilenameManual", err, uploadedFileName, "");

		return true;
	}
}


exports.UpdateVideoUrlInAnalysisManual = async (analysis_id, analysis_video) => {
	try {
		var analysis = await db.Analysis.update({
			video_url: analysis_video
		}, {
			where: {
				id: analysis_id
			}
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["analysis_id"] = analysis_id;
		combine_return_variable["analysis_video"] = analysis_video;

		collectErrorLog(path.basename(__filename), "UpdateVideoUrlInAnalysisManual", err, combine_return_variable, "");

		return false;
	}
};

exports.UpdateRecordingVideoTime = async (req, res) => {
	try {
		var video = await db.VideoUploadingTbl.create({
			upload_type: req.body.upload_type,
			event_time: req.body.event_time,
			internet_speed: JSON.stringify(req.body.internet_speed),
			input_data: JSON.stringify(req.body.input_data),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		if (video) {
			return res.status(200).json({ video: video, status: true });
		} else {
			return res.status(404).json({ msg: "Something went wrong. Please try again.", status: false });
		}
	} catch (err) {
		collectErrorLog(path.basename(__filename), "UpdateRecordingVideoTime", err, req.body, "");
		return res.status(404).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};

exports.logRecordingTime = async (req, res) => {
	try {
		var video = await db.VideoUploadingTbl.create({
			upload_type: req.body.upload_type,
			input_data: JSON.stringify(req.body.input_data),
			event_time: req.body.event_time,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return res.status(200).json({ video: video, status: true });
	} catch (err) {
		collectErrorLog(path.basename(__filename), "logRecordingTime", err, req.body, "");
		return res.status(404).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.GetCurrentBallVideo = async (req, res) => {
	try {

		var video = await VideoFileTbl.findAll({
			where: {
				filepath: {
					[Op.like]: req.body.fileName + '.mp4'
				},
			}
		})
		return res.status(200).json({ videoCount: video.length, success: "1", msg: "0" });

	} catch (err) {
		collectErrorLog(path.basename(__filename), "GetCurrentBallVideo", err, req.body, "");

		return res.status(400).json({
			msg: "Something went wrong. Please try again.",
			status: false,
			error: err,
		});
	}
};


exports.UpdateThumbnailUrlInAnalysisCRON = async (analysis_id, analysis_thumbnail) => {
	try {
		var analysis = await db.Analysis.update({
			video_thumbnail_url: analysis_thumbnail
		}, {
			where: {
				id: analysis_id
			}
		});
		return true;
	} catch (err) {
		let combine_return_variable = {};
		combine_return_variable["analysis_id"] = analysis_id;
		combine_return_variable["analysis_thumbnail"] = analysis_thumbnail;

		collectErrorLog(path.basename(__filename), "UpdateThumbnailUrlInAnalysisCRON", err, combine_return_variable, "");

		return false;
	}
};
